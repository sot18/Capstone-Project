# Capstone-Project
Project Set Up Instructions:
# Create React project
npx create-react-app my-app
cd my-app

# Start development server
npm start

# React Router for routing
npm install react-router-dom@6

# Firebase SDK
npm install firebase

# TailwindCSS (optional, for styling)
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Start React dev server
npm start

# Create project folder
mkdir backend
cd backend

# Create virtual environment
python -m venv venv

# Activate venv
# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

# Install Flask and CORS
pip install flask flask-cors

# Run Flask app
python app.py

# Deactivate venv
deactivate
