from flask import Flask, jsonify

app = Flask(__name__)

@app.route("/api/hello")
def hello():
    return jsonify(message="Hello from Flask!")

@app.route("/")
def home():
    return "Welcome to Flask! Try /api/hello"

if __name__ == "__main__":
    app.run(debug=True, port=5000)