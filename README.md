# 🤖 AI Chatbot Platform (Flask + React)

A full-stack AI chatbot platform built with **Flask (Python Backend)** and **React (Frontend)** that supports multiple AI models, authentication, cloud storage integration, and scalable API architecture.

The platform enables users to interact with advanced AI models, manage chat sessions, and securely store conversations while providing a modern and responsive user experience.

---

## ✨ Features

### 🔹 Backend (Flask)

* RESTful API architecture
* Multi-model AI integration
* LLaMA integration via Replicate
* Cohere Chat API integration
* Google Drive OAuth integration
* Automatic chat storage as JSON files in Google Drive
* Session-based chat history management
* Secure authentication and authorization
* CORS support for frontend communication
* Environment variable configuration
* Detailed application logging
* Scalable and modular backend design

### 🔹 Frontend (React)

* Modern and responsive user interface
* Firebase Authentication
* AI-powered conversational interface
* Multiple AI model selection
* Persistent chat sessions
* Real-time communication with backend APIs
* Mobile-friendly design
* Clean and intuitive user experience

---

## 🧱 Tech Stack

### Backend

* Python
* Flask
* Flask-Session
* Flask-CORS
* Google Drive API
* OAuth 2.0
* Replicate API
* Cohere API

### Frontend

* React
* Firebase Authentication
* Axios
* HTML5
* CSS3
* JavaScript

### Cloud & Services

* Google Drive
* Firebase
* Replicate
* Cohere

---

## 🚀 AI Models Supported

### LLaMA

* Integrated using Replicate API
* Supports advanced conversational AI tasks
* Context-aware responses

### Cohere

* Natural language understanding
* Conversational AI capabilities
* Fast and scalable inference

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
│
└── docs/
```

---

## 🔐 Authentication

The platform supports:

* Firebase Authentication
* OAuth 2.0 Authentication
* Session-based User Management
* Secure API Communication

---

## 💾 Chat Storage

The application automatically stores chat conversations:

* Session Memory Storage
* Google Drive Cloud Storage
* JSON-based conversation format
* Persistent chat history

---

## ⚙️ Installation

### Clone Repository

```bash
git clone https://github.com/your-username/ai-chatbot-platform.git
cd ai-chatbot-platform
```

### Backend Setup

```bash
cd flaskapp

python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

### Configure Environment Variables

Create a `.env` file:

```env
COHERE_API_KEY=your_cohere_key
REPLICATE_API_TOKEN=your_replicate_token
SECRET_KEY=your_secret_key
```

### Run Flask Server

```bash
python app.py
```

Backend runs on:

```text
http://localhost:5000
```

---

### Frontend Setup

```bash
cd custom-chat-app

npm install
npm start
```

Frontend runs on:

```text
http://localhost:3000
```

---

## 📌 API Overview

### Chat Endpoint

```http
POST /chat
```

### Authentication

```http
POST /login
POST /logout
```

### Session Management

```http
GET /session
```

---

## 🎯 Future Enhancements

* GPT Model Integration
* Voice-based Conversations
* Image Understanding
* PDF Chat Support
* Multi-user Workspaces
* AI Agent System
* Analytics Dashboard
* Fine-tuned Custom Models
* Real-time Collaboration

---

## 👨‍💻 Developers

### Tellamekala Manoj

* AI & Machine Learning Enthusiast
* Python Developer
* Cloud Computing Learner
* Focus Areas:

  * Machine Learning
  * Deep Learning
  * NLP
  * Data Analysis
  * AI Applications

### Yenugu Chenna Kesava Reddy

* Full-Stack Developer
* AI & Software Engineering Enthusiast
* Focus Areas:

  * React Development
  * Flask Development
  * AI Integration
  * Supabase
  * Cloud Technologies
  * System Design

GitHub:
https://github.com/ychennakesavareddy

LinkedIn:
https://www.linkedin.com/in/ychennakesavareddy

---

## 🤝 Contributing

Contributions are welcome!

If you would like to improve the project:

1. Fork the repository
2. Create a feature branch

```bash
git checkout -b feature-name
```

3. Commit changes

```bash
git commit -m "Add feature"
```

4. Push to GitHub

```bash
git push origin feature-name
```

5. Create a Pull Request

Areas where contributions are appreciated:

* AI model integrations
* UI/UX improvements
* Performance optimization
* Documentation updates
* Security enhancements
* Cloud deployment improvements

---

## 🙏 Acknowledgements

Special thanks to:

* Flask Community
* React Community
* Cohere
* Replicate
* Firebase
* Google Drive API
* Open Source Contributors

for providing tools and technologies that made this project possible.

---

## 📄 License

This project is open-source and intended for educational, research, and experimental purposes.

Feel free to use, modify, and distribute the code while providing proper attribution to the original developers.

---

⭐ If you find this project useful, consider giving it a star and contributing to its growth.
