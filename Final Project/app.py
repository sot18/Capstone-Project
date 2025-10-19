from flask import Flask, request, jsonify
from flask_cors import CORS
import os, uuid, requests
from dotenv import load_dotenv
from openai import OpenAI
from pdf2image import convert_from_bytes
import pytesseract
import firebase_admin
from firebase_admin import credentials, firestore, storage

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise EnvironmentError("Please set OPENAI_API_KEY in environment or .env")

client = OpenAI(api_key=OPENAI_API_KEY)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# Firebase init
if not firebase_admin._apps:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred, {
        "storageBucket": "final-project-6b77f.appspot.com"
    })
db = firestore.client()
bucket = storage.bucket()

# ---------------- Upload notes ----------------
@app.route("/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    user_id = request.form.get("userId") or "unknown_user"
    filename = file.filename
    unique_id = str(uuid.uuid4())
    blob_name = f"notes/{user_id}/{unique_id}/{filename}"

    try:
        blob = bucket.blob(blob_name)
        blob.upload_from_file(file, content_type=file.content_type)
        blob.make_public()
        file_url = blob.public_url

        doc_ref = db.collection("notes").add({
            "userId": user_id,
            "fileName": filename,
            "fileUrl": file_url,
            "storagePath": blob_name,
            "createdAt": firestore.SERVER_TIMESTAMP,
        })

        return jsonify({"url": file_url, "fileName": filename, "id": doc_ref[1].id}), 200
    except Exception as e:
        print("Upload error:", e)
        return jsonify({"error": str(e)}), 500

# ---------------- Get notes ----------------
@app.route("/api/notes", methods=["GET"])
def get_notes():
    uid = request.args.get("uid")
    try:
        if not uid:
            return jsonify([])
        notes_ref = db.collection("notes")
        query = notes_ref.where("userId", "==", uid).order_by("createdAt", direction=firestore.Query.DESCENDING)
        docs = query.stream()
        result = []
        for d in docs:
            data = d.to_dict()
            result.append({
                "id": d.id,
                "name": data.get("fileName"),
                "url": data.get("fileUrl"),
                "storagePath": data.get("storagePath"),
                "createdAt": data.get("createdAt").isoformat() if data.get("createdAt") else None
            })
        return jsonify(result)
    except Exception as e:
        print("Get notes error:", e)
        return jsonify({"error": "Failed to fetch notes"}), 500

# ---------------- Chat endpoint ----------------
@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json() or {}
    user_message = data.get("message")
    note_url = data.get("note_url")
    user_id = data.get("userId", "guest")
    session_id = data.get("sessionId") or str(uuid.uuid4())
    conversation_name = data.get("conversationName") or "New Conversation"

    if not user_message or not note_url:
        return jsonify({"reply": "Please select a note and enter a question.", "sessionId": session_id}), 400

    try:
        resp = requests.get(note_url, timeout=20)
        resp.raise_for_status()
        images = convert_from_bytes(resp.content)
        text_content = ""
        for img in images:
            text_content += pytesseract.image_to_string(img)
        context = text_content[:15000]

        prompt = f"""
You are StudyBuddy AI. Answer the user’s question using ONLY the content of the note below.
Do NOT invent information.

--- NOTE START ---
{context}
--- NOTE END ---

Question: {user_message}
Answer in a clear and concise sentence.
"""
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful study assistant that answers only from the note."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
        )

        reply = completion.choices[0].message.content.strip()

        db.collection("conversations").add({
            "user_id": user_id,
            "session_id": session_id,
            "note_url": note_url,
            "message": user_message,
            "reply": reply,
            "conversation_name": conversation_name,
            "createdAt": firestore.SERVER_TIMESTAMP
        })

        return jsonify({"reply": reply, "sessionId": session_id}), 200
    except Exception as e:
        print("Chatbot error:", e)
        return jsonify({"reply": "Error processing note or AI response.", "sessionId": session_id}), 500

# ---------------- Get sessions ----------------
@app.route("/api/sessions", methods=["GET"])
def get_sessions():
    uid = request.args.get("uid")
    if not uid:
        return jsonify([])

    try:
        conv_ref = db.collection("conversations").where("user_id", "==", uid)
        docs = conv_ref.stream()
        sessions = {}

        for d in docs:
            data = d.to_dict()
            sid = data.get("session_id")
            if sid not in sessions:
                sessions[sid] = {
                    "sessionId": sid,
                    "note_url": data.get("note_url"),
                    "createdAt": data.get("createdAt"),
                    "messages": [],
                    "name": data.get("conversation_name") or "New Conversation"
                }

            sessions[sid]["messages"].append({
                "message": data.get("message"),
                "reply": data.get("reply"),
                "createdAt": data.get("createdAt")
            })

        sessions_list = []

        for s in sessions.values():
            # Ensure messages array is always sorted
            s["messages"].sort(key=lambda x: x["createdAt"])
            # Ensure name is always present
            if not s.get("name"):
                s["name"] = "New Conversation"
            sessions_list.append(s)

        # Sort sessions by latest message timestamp
        sessions_list.sort(key=lambda x: x["messages"][-1]["createdAt"] if x["messages"] else x["createdAt"], reverse=True)

        return jsonify(sessions_list)
    except Exception as e:
        print("Session fetch error:", e)
        return jsonify({"error": str(e)}), 500


# ---------------- Run ----------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
