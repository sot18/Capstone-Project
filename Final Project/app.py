
# Import required libraries
from flask import Flask, request, jsonify  # Flask for web server, request for HTTP data, jsonify to return JSON
from flask_cors import CORS  # To handle Cross-Origin Resource Sharing
import os, uuid, requests  # os for env variables, uuid for unique IDs, requests to fetch files via URL
from dotenv import load_dotenv  # Load environment variables from .env file
from openai import OpenAI  # OpenAI client
from pdf2image import convert_from_bytes  # Convert PDF bytes to images
import pytesseract  # OCR to extract text from images
import firebase_admin  # Firebase SDK
from firebase_admin import credentials, firestore, storage  # Firebase services
import json

# Load environment variables from .env file
load_dotenv()

# Fetch OpenAI API key from environment
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise EnvironmentError("Please set OPENAI_API_KEY in environment or .env")

# Initialize OpenAI client
client = OpenAI(api_key=OPENAI_API_KEY)

# Initialize Flask app
app = Flask(__name__)
# Enable CORS to allow requests from any origin (for frontend-backend communication)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# ---------------- Initialize Firebase ----------------
if not firebase_admin._apps:
    # Load Firebase service account credentials
    cred = credentials.Certificate("serviceAccountKey.json")
    # Initialize Firebase app with storage bucket
    firebase_admin.initialize_app(cred, {
        "storageBucket": "final-project-6b77f.appspot.com"
    })

# Create Firestore client for database access
db = firestore.client()
# Access Firebase Storage bucket
bucket = storage.bucket()

# ---------------- Upload notes endpoint ----------------
@app.route("/upload", methods=["POST"])
def upload_file():
    # Check if a file is in the request
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]  # Get uploaded file
    user_id = request.form.get("userId") or "unknown_user"  # Get userId or default
    filename = file.filename  # Original filename
    unique_id = str(uuid.uuid4())  # Generate unique ID for storage path
    blob_name = f"notes/{user_id}/{unique_id}/{filename}"  # Storage path in Firebase

    try:
        # Create a blob object in Firebase Storage and upload file
        blob = bucket.blob(blob_name)
        blob.upload_from_file(file, content_type=file.content_type)
        blob.make_public()  # Make file publicly accessible
        file_url = blob.public_url  # Get public URL of the file

        # Add file metadata to Firestore
        doc_ref = db.collection("notes").add({
            "userId": user_id,
            "fileName": filename,
            "fileUrl": file_url,
            "storagePath": blob_name,
            "createdAt": firestore.SERVER_TIMESTAMP,  # Auto timestamp
        })

        # Return success response with file URL and Firestore document ID
        return jsonify({"url": file_url, "fileName": filename, "id": doc_ref[1].id}), 200
    except Exception as e:
        print("Upload error:", e)
        return jsonify({"error": str(e)}), 500

# ---------------- Get notes for a user ----------------
@app.route("/api/notes", methods=["GET"])
def get_notes():
    uid = request.args.get("uid")  # Get user ID from query param
    try:
        if not uid:
            return jsonify([])  # Return empty list if no UID provided

        # Query Firestore for notes belonging to user, ordered by newest first
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
    data = request.get_json() or {}  # Get JSON payload
    user_message = data.get("message")  # User's question
    note_url = data.get("note_url")  # URL of the note to read
    user_id = data.get("userId", "guest")  # User ID
    session_id = data.get("sessionId") or str(uuid.uuid4())  # Session ID
    conversation_name = data.get("conversationName") or "New Conversation"  # Conversation name

    # Validate required fields
    if not user_message or not note_url:
        return jsonify({"reply": "Please select a note and enter a question.", "sessionId": session_id}), 400

    try:
        # Download the note PDF from URL
        resp = requests.get(note_url, timeout=20)
        resp.raise_for_status()

        # Convert PDF bytes to images
        images = convert_from_bytes(resp.content)
        text_content = ""
        for img in images:
            # Extract text from each page image
            text_content += pytesseract.image_to_string(img)

        # Limit context to 15k characters
        context = text_content[:15000]

        # Build prompt for OpenAI
        prompt = f"""
You are StudyBuddy AI. Answer the user’s question using ONLY the content of the note below.
Do NOT invent information.

--- NOTE START ---
{context}
--- NOTE END ---

Question: {user_message}
Answer in a clear and concise sentence.
"""

        # Call OpenAI API to get a response
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful study assistant that answers only from the note."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,  # Low randomness for consistent answers
        )

        # Extract reply from OpenAI response
        reply = completion.choices[0].message.content.strip()

        # Save conversation in Firestore
        db.collection("conversations").add({
            "user_id": user_id,
            "session_id": session_id,
            "note_url": note_url,
            "message": user_message,
            "reply": reply,
            "conversation_name": conversation_name,
            "createdAt": firestore.SERVER_TIMESTAMP
        })

        # Return reply and session ID
        return jsonify({"reply": reply, "sessionId": session_id}), 200
    except Exception as e:
        print("Chatbot error:", e)
        return jsonify({"reply": "Error processing note or AI response.", "sessionId": session_id}), 500

# ---------------- Get chat sessions for a user ----------------
@app.route("/api/sessions", methods=["GET"])
def get_sessions():
    uid = request.args.get("uid")  # User ID
    if not uid:
        return jsonify([])

    try:
        # Query conversations for the user
        conv_ref = db.collection("conversations").where("user_id", "==", uid)
        docs = conv_ref.stream()

        sessions = {}  # Store sessions grouped by session_id

        for d in docs:
            data = d.to_dict()
            sid = data.get("session_id")
            if sid not in sessions:
                # Create new session object
                sessions[sid] = {
                    "sessionId": sid,
                    "note_url": data.get("note_url"),
                    "createdAt": data.get("createdAt"),
                    "messages": [],
                    "name": data.get("conversation_name") or "New Conversation"
                }

            # Append message-reply pair to session
            sessions[sid]["messages"].append({
                "message": data.get("message"),
                "reply": data.get("reply"),
                "createdAt": data.get("createdAt")
            })

        sessions_list = []

        for s in sessions.values():
            # Sort messages in session by creation timestamp
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


@app.route("/api/generate_quiz", methods=["POST"])
def generate_quiz():
    try:
        data = request.get_json()
        uid = data.get("uid")
        note_ids = data.get("note_ids", [])
        difficulty = data.get("difficulty", "medium")

        if not uid or not note_ids:
            return jsonify({"error": "Missing UID or note selection"}), 400

        all_text = ""
        for note_id in note_ids:
            note_ref = db.collection("notes").document(note_id).get()
            if note_ref.exists:
                note_data = note_ref.to_dict()
                file_url = note_data.get("fileUrl")
                if file_url:
                    try:
                        resp = requests.get(file_url, timeout=20)
                        resp.raise_for_status()
                        images = convert_from_bytes(resp.content)
                        text_content = ""
                        for img in images:
                            text_content += pytesseract.image_to_string(img)
                        all_text += text_content + "\n"
                    except Exception as e:
                        print(f"Error reading note {note_id}: {e}")

        if not all_text.strip():
            return jsonify({"error": "No content found in selected notes"}), 400

        # OpenAI prompt
        prompt = f"""
Generate 10 multiple-choice questions from the following notes.
Each should have 4 options (A, B, C, D) and one correct answer.
Difficulty: {difficulty}.
Notes: {all_text}
Return ONLY a JSON array like this:
[
  {{
    "question": "Question text",
    "options": ["A", "B", "C", "D"],
    "answer": "A"
  }}
]
Do NOT include explanations or extra text.
"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}]
        )
        content = response.choices[0].message.content.strip()
        quiz_json = json.loads(content)

        # Normalize to include 'choices' for frontend
        normalized_quiz = []
        for q in quiz_json:
            normalized_quiz.append({
                "question": q.get("question"),
                "choices": q.get("options", []),
                "answer": q.get("answer")
            })

        # Store quiz for grading later
        quiz_doc = db.collection("quizzes").add({
            "user_id": uid,
            "questions": normalized_quiz,
            "difficulty": difficulty,
            "createdAt": firestore.SERVER_TIMESTAMP
        })

        return jsonify({
            "quiz": {"id": quiz_doc[1].id, "questions": normalized_quiz}
        })

    except Exception as e:
        print("Error generating quiz:", e)
        return jsonify({"error": str(e)}), 500


@app.route("/api/submit_quiz", methods=["POST"])
def submit_quiz():
    try:
        data = request.get_json()
        uid = data.get("uid")
        quiz_id = data.get("quiz_id")
        user_answers = data.get("answers", {})

        if not uid or not quiz_id:
            return jsonify({"error": "Missing UID or quiz ID"}), 400

        quiz_ref = db.collection("quizzes").document(quiz_id).get()
        if not quiz_ref.exists:
            return jsonify({"error": "Quiz not found"}), 404

        quiz_data = quiz_ref.to_dict()
        questions = quiz_data.get("questions", [])

        total = len(questions)
        correct_count = 0

        for idx, q in enumerate(questions):
            correct_answer = q.get("answer")
            user_answer = user_answers.get(str(idx)) or user_answers.get(idx)
            if user_answer == correct_answer:
                correct_count += 1

        score = round((correct_count / total) * 100)

        return jsonify({
            "score": score,
            "correct": correct_count,
            "total": total
        })

    except Exception as e:
        print("Error submitting quiz:", e)
        return jsonify({"error": str(e)}), 500


# ---------------- Run Flask app ----------------
if __name__ == "__main__":
    # Run on all interfaces, port 5001, with debug mode on
    app.run(host="0.0.0.0", port=5001, debug=True)
