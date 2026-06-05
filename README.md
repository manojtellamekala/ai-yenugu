# AI Chatbot Platform (Flask + React)

A full-stack AI chatbot platform built with **Flask (Python backend)** and **React (frontend)** that supports:
- Multiple AI models (LLaMA via Replicate, Cohere)
- Google Drive integration for chat storage
- Session-based chat history
- OAuth authentication
- Scalable REST API architecture

This project is designed for **learning, experimentation, and open-source collaboration**.

---

## ✨ Features

### 🔹 Backend (Flask)
- REST APIs for chat, authentication, and session handling
- Multi-model AI support:
  - LLaMA (via Replicate)
  - Cohere Chat API
- Google Drive OAuth integration
- Automatic chat storage as JSON files in Google Drive
- Session-based chat history (memory + Drive)
- CORS support for frontend integration
- Detailed logging (`app.log`)

### 🔹 Frontend (React)
- User authentication (Firebase)
- Chat interface with AI responses
- Model selection
- Persistent chat sessions
- Clean and responsive UI

---

## 🧱 Tech Stack

### Backend
- Python
- Flask
- Flask-Session
- Flask-CORS
- Google Drive API
- Replicate API
- Cohere API
- OAuth 2.0

### Frontend
- React
- Firebase Authentication
- Axios
- CSS

---

## 📂 Project Structure

```text
chatbot/
├── flaskapp/
│   ├── app.py
│   ├── requirements.txt
│   ├── render.yaml
│   ├── client_secret.json
│   ├── .env
│   ├── .flask_session/
│   ├── app.log
│   └── README.md
│
├── custom-chat-app/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── README.md
```

---

## 📄 License

This project is open-source and intended for educational and experimental use.

---

