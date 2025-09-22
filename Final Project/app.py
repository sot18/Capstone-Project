from flask import Flask, request, jsonify
from flask_cors import CORS
import uuid
import firebase_admin
from firebase_admin import credentials, storage

cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred, {
    "storageBucket": "final-project-6b77f.firebasestorage.app" # match React firebase.js
})

bucket = storage.bucket()

app = Flask(__name__)
CORS(app)

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

if __name__ == "__main__":
    app.run(debug=True)
