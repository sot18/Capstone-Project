# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
import uuid
import tempfile
import requests
from openai import OpenAI
from pdf2image import convert_from_bytes
import pytesseract

# Firebase admin
import firebase_admin
from firebase_admin import credentials, storage, firestore

# Load environment variables
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise EnvironmentError("Please set OPENAI_API_KEY in environment or .env")

# Init OpenAI client
client = OpenAI(api_key=OPENAI_API_KEY)

# Initialize Flask
app = Flask(__name__)
CORS(app)

# -------------------------
# Firebase init (admin SDK)
# -------------------------
if not firebase_admin._apps:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred, {
        "storageBucket": "final-project-6b77f.appspot.com"
    })

bucket = storage.bucket()
db = firestore.client()

# =======================
# Upload endpoint
# =======================
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

# =======================
# Get notes for a user
# =======================
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

# =======================
# Delete note
# =======================
@app.route("/api/delete-note", methods=["POST"])
def delete_note():
    data = request.get_json()
    doc_id = data.get("id")
    storage_path = data.get("storagePath")
    try:
        if storage_path:
            blob = bucket.blob(storage_path)
            blob.delete()
        if doc_id:
            db.collection("notes").document(doc_id).delete()
        return jsonify({"ok": True})
    except Exception as e:
        print("Delete note error:", e)
        return jsonify({"error": str(e)}), 500

# =======================
# Chat endpoint with OCR
# =======================
@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json() or {}
    user_message = data.get("message")
    note_url = data.get("note_url")

    if not user_message or not note_url:
        return jsonify({"reply": "Please select a note and enter a question."}), 400

    try:
        # Download PDF from Firebase
        resp = requests.get(note_url, timeout=20)
        resp.raise_for_status()

        # Convert PDF pages to images
        images = convert_from_bytes(resp.content)

        # OCR each page
        text_content = ""
        for img in images:
            text_content += pytesseract.image_to_string(img)

        if not text_content.strip():
            return jsonify({"reply": "No readable text found in this note."}), 200

        # Limit context size
        context = text_content[:15000]

        # AI prompt
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
        return jsonify({"reply": reply})

    except Exception as e:
        print("Chatbot error:", e)
        return jsonify({"reply": "Error processing note or AI response."}), 500

# =======================
# Run
# =======================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
