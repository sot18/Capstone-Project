from flask import Flask, request, jsonify
from flask_cors import CORS
import uuid
import firebase_admin
from firebase_admin import credentials, storage
import os
from dotenv import load_dotenv
from openai import OpenAI

# -------------------------------
# 🔐 Load Environment Variables
# -------------------------------
load_dotenv()  # loads variables from .env file

# -------------------------------
# 🔥 Firebase Initialization
# -------------------------------
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred, {
    "storageBucket": "final-project-6b77f.firebasestorage.app"  # match React firebase.js
})
bucket = storage.bucket()

# -------------------------------
# ⚙️ Flask Setup
# -------------------------------
app = Flask(__name__)
# ✅ Enable CORS specifically for React frontend
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

# -------------------------------
# ☁️ File Upload Endpoint
# -------------------------------
@app.route("/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    file_name = file.filename
    unique_id = str(uuid.uuid4())
    blob_name = f"notes/{unique_id}/{file_name}"

    try:
        blob = bucket.blob(blob_name)
        blob.upload_from_file(file, content_type=file.content_type)
        blob.make_public()
        return jsonify({"url": blob.public_url, "fileName": blob_name}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# -------------------------------
# 🤖 AI Chatbot Endpoint
# -------------------------------
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise EnvironmentError(
        "❌ Please set your OPENAI_API_KEY in a .env file or environment variable."
    )

client = OpenAI(api_key=OPENAI_API_KEY)

@app.route("/api/chat", methods=["POST"])
def chat():
    """Chatbot endpoint — receives user message, returns AI response"""
    try:
        data = request.get_json()
        user_message = data.get("message", "")

        if not user_message:
            return jsonify({"error": "No message provided"}), 400

        response = client.chat.completions.create(
         model="gpt-3.5-turbo",
         messages=[
        {
            "role": "system",
            "content": (
                "You are StudyBuddy, an AI tutor that helps students learn from their notes. "
                "Answer clearly, explain simply, and encourage good study habits."
            ),
        },
        {"role": "user", "content": user_message},
    ],
    temperature=0.7,
)

        reply = response.choices[0].message.content.strip()
        return jsonify({"reply": reply}), 200

    except Exception as e:
        print("Chatbot error:", e)
        return jsonify({"error": "Failed to get response from AI."}), 500

# -------------------------------
# 🚀 Run the App
# -------------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
