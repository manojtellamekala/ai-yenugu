import os
import logging
import secrets
import uuid
import json
from flask import Flask, request, jsonify, session
from flask_cors import CORS
from flask_session import Session
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.http import MediaInMemoryUpload
from googleapiclient.errors import HttpError
import requests
import datetime
import replicate
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app, supports_credentials=True, resources={r"/api/*": {"origins": "http://localhost:3000"}})

# Configuration
app.secret_key = os.getenv("FLASK_SECRET_KEY", secrets.token_hex(32))
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = False
app.config['SESSION_FILE_DIR'] = './.flask_session/'
app.config['PERMANENT_SESSION_LIFETIME'] = datetime.timedelta(hours=24)

# Allow HTTP for localhost development
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
os.environ['OAUTHLIB_RELAX_TOKEN_SCOPE'] = '1'

Session(app)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Constants
SCOPES = ["https://www.googleapis.com/auth/drive.file"]
REDIRECT_URI = "http://localhost:5000/api/drive-callback"
FRONTEND_URL = "http://localhost:3000"
MAX_NEW_TOKENS = 700

# AI Models configuration
AI_MODELS = {
    "cohere": os.getenv("COHERE_API_KEY"),
    "llama": os.getenv("REPLICATE_API_TOKEN")
}

MODEL_IDS = {
    "cohere": "command",
    "llama": "meta/llama-2-70b-chat:02e509c789964a7ea8736978a43525956ef40397be9033abf9fd2badfe68c9e3"
}

class AIModelHandler:
    def __init__(self):
        self.models_initialized = {
            "cohere": bool(AI_MODELS["cohere"]),
            "llama": bool(AI_MODELS["llama"])
        }
        logger.info(f"Models initialized: {self.models_initialized}")

    def generate_response(self, model: str, message: str) -> str:
        """Generate response using the specified model"""
        if model == "cohere":
            return self._generate_cohere_response(message)
        elif model == "llama":
            return self._generate_llama_response(message)
        else:
            raise ValueError(f"Unsupported model: {model}")

    def _generate_cohere_response(self, message: str) -> str:
        """Generate response using Cohere API"""
        if not self.models_initialized["cohere"]:
            raise ValueError("Cohere API key not configured")
        
        try:
            response = requests.post(
                "https://api.cohere.ai/v1/chat",
                headers={
                    "Authorization": f"Bearer {AI_MODELS['cohere']}",
                    "Content-Type": "application/json"
                },
                json={
                    "message": message,
                    "model": MODEL_IDS["cohere"],
                    "temperature": 0.7,
                    "max_tokens": MAX_NEW_TOKENS
                },
                timeout=30
            )
            response.raise_for_status()
            return response.json()["text"]
        except Exception as e:
            logger.error(f"Cohere API error: {str(e)}")
            raise ValueError(f"Cohere error: {str(e)}")

    def _generate_llama_response(self, message: str) -> str:
        """Generate response using Llama via Replicate"""
        if not self.models_initialized["llama"]:
            raise ValueError("Replicate API token not configured")
        
        try:
            output = replicate.run(
                MODEL_IDS["llama"],
                input={
                    "prompt": message,
                    "temperature": 0.7,
                    "max_new_tokens": MAX_NEW_TOKENS,
                    "top_p": 0.9
                }
            )
            return "".join(output)
        except Exception as e:
            logger.error(f"Llama generation failed: {str(e)}")
            raise ValueError(f"Llama error: {str(e)}")

# Initialize AI models
ai_handler = AIModelHandler()

def get_flow():
    """Returns a configured Flow instance for OAuth"""
    return Flow.from_client_secrets_file(
        'client_secret.json',
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI
    )

def get_drive_service():
    """Returns a configured Drive service instance"""
    if 'credentials' not in session:
        return None
    
    try:
        creds = Credentials(**session['credentials'])
        return build('drive', 'v3', credentials=creds)
    except Exception as e:
        logger.error(f"Error creating Drive service: {str(e)}")
        return None

def is_drive_connected():
    """Returns True if Drive is properly connected"""
    if 'credentials' not in session:
        return False
    if 'drive_folder_id' not in session:
        try:
            drive_service = get_drive_service()
            if drive_service:
                ensure_drive_folder(drive_service)
                return 'drive_folder_id' in session
        except Exception:
            return False
    return True

def ensure_drive_folder(drive_service):
    """Ensures the AI Chat Storage folder exists and returns its ID"""
    if 'drive_folder_id' in session:
        try:
            drive_service.files().get(fileId=session['drive_folder_id'], fields='id').execute()
            return session['drive_folder_id']
        except HttpError:
            pass
    
    try:
        query = "mimeType='application/vnd.google-apps.folder' and name='AI Chat Storage' and trashed=false"
        folders = drive_service.files().list(q=query, fields="files(id,name)").execute().get('files', [])
        
        if folders:
            folder_id = folders[0]['id']
        else:
            folder_metadata = {
                'name': 'AI Chat Storage',
                'mimeType': 'application/vnd.google-apps.folder'
            }
            folder = drive_service.files().create(body=folder_metadata, fields='id').execute()
            folder_id = folder.get('id')
        
        session['drive_folder_id'] = folder_id
        session.modified = True
        return folder_id
    except Exception as e:
        logger.error(f"Error ensuring Drive folder: {str(e)}")
        raise

def store_chat_in_drive(chat_id: str, chat_data: dict) -> bool:
    """Stores entire chat conversation in a single file"""
    try:
        drive_service = get_drive_service()
        if not drive_service:
            logger.error("Drive service not available")
            return False
        
        folder_id = ensure_drive_folder(drive_service)
        if not folder_id:
            logger.error("Failed to get or create Drive folder")
            return False

        # Check for existing file
        query = f"name='chat_{chat_id}.json' and '{folder_id}' in parents and trashed=false"
        existing_files = drive_service.files().list(q=query, fields="files(id)").execute().get('files', [])

        file_metadata = {
            'name': f'chat_{chat_id}.json',
            'parents': [folder_id],
            'mimeType': 'application/json'
        }
        
        # Convert entire chat data to JSON
        json_data = json.dumps(chat_data, indent=2).encode('utf-8')
        media = MediaInMemoryUpload(json_data, mimetype='application/json')

        if existing_files:
            # Delete existing file first to ensure clean update
            drive_service.files().delete(fileId=existing_files[0]['id']).execute()
        
        # Create new file with all messages
        file = drive_service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id'
        ).execute()
        
        logger.info(f"Stored chat {chat_id} with {len(chat_data.get('messages', []))} messages")
        return True
    except Exception as e:
        logger.error(f"Error storing chat in Drive: {str(e)}")
        return False

def fetch_chat_from_drive(chat_id: str) -> dict:
    """Retrieves entire chat conversation from a single file"""
    try:
        drive_service = get_drive_service()
        if not drive_service:
            logger.error("Drive service not available")
            return None

        if 'drive_folder_id' not in session:
            logger.error("Drive folder ID not found in session")
            return None

        query = f"name='chat_{chat_id}.json' and '{session['drive_folder_id']}' in parents and trashed=false"
        files = drive_service.files().list(
            q=query,
            fields='files(id,name,mimeType,modifiedTime)'
        ).execute().get('files', [])

        if not files:
            logger.error(f"No chat file found for ID: {chat_id}")
            return None

        # Get the most recent file if multiple exist
        file = max(files, key=lambda x: x.get('modifiedTime', ''))
        
        # Get file content
        request = drive_service.files().get_media(fileId=file['id'])
        file_content = request.execute()
        
        try:
            chat_data = json.loads(file_content.decode('utf-8'))
            logger.info(f"Successfully loaded chat {chat_id} from Drive")
            return chat_data
        except json.JSONDecodeError as e:
            logger.error(f"Error decoding chat JSON: {str(e)}")
            return None
    except Exception as e:
        logger.error(f"Error fetching chat from Drive: {str(e)}")
        return None

@app.route('/api/logout', methods=['GET'])
def logout():
    """Clears the current session"""
    session.clear()
    return jsonify({"success": True})

@app.route('/api/drive-login', methods=['GET'])
def drive_login():
    """Initiates Google Drive OAuth flow"""
    try:
        state = secrets.token_urlsafe(32)
        session['oauth_state'] = state
        session.modified = True
        
        flow = get_flow()
        auth_url, _ = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent',
            state=state
        )
        
        return jsonify({"auth_url": auth_url})
    except Exception as e:
        logger.error(f"Drive login initiation error: {str(e)}")
        return jsonify({"error": "Failed to initiate Google Drive login"}), 500

@app.route('/api/drive-callback', methods=['GET'])
def drive_callback():
    """Handles Google Drive OAuth callback"""
    try:
        state = request.args.get('state')
        stored_state = session.get('oauth_state')
        
        if not state or not stored_state or not secrets.compare_digest(state, stored_state):
            logger.error("State validation failed")
            return f"""
            <html><body><script>
                window.opener.postMessage({{type: 'auth-error', error: 'invalid_state'}}, '{FRONTEND_URL}');
                window.close();
            </script></body></html>
            """
        
        flow = get_flow()
        flow.fetch_token(authorization_response=request.url)
        
        credentials = flow.credentials
        session['credentials'] = {
            'token': credentials.token,
            'refresh_token': credentials.refresh_token,
            'token_uri': credentials.token_uri,
            'client_id': credentials.client_id,
            'client_secret': credentials.client_secret,
            'scopes': credentials.scopes
        }
        
        # Initialize Drive service and ensure folder exists
        drive_service = build('drive', 'v3', credentials=credentials)
        ensure_drive_folder(drive_service)
        
        session.modified = True
        
        return f"""
        <html><body><script>
            window.opener.postMessage({{type: 'auth-success'}}, '{FRONTEND_URL}');
            window.close();
        </script></body></html>
        """
    except Exception as e:
        logger.error(f"Drive callback error: {str(e)}")
        return f"""
        <html><body><script>
            window.opener.postMessage({{type: 'auth-error', error: {json.dumps(str(e))}}}, '{FRONTEND_URL}');
            window.close();
        </script></body></html>
        """

@app.route('/api/auth-status', methods=['GET'])
def auth_status():
    """Returns the current authentication status"""
    return jsonify({
        "authenticated": 'credentials' in session,
        "drive_connected": is_drive_connected(),
        "folder_id": session.get('drive_folder_id')
    })

@app.route('/api/chat', methods=['POST'])
def chat():
    """Handles chat messages and AI responses"""
    data = request.json
    message = data.get('message')
    model = data.get('model', 'llama')  # Default to llama
    chat_id = data.get('chat_id')

    if not message or not isinstance(message, str):
        return jsonify({"error": "Invalid message provided"}), 400

    try:
        # Verify model is supported and configured
        if model not in AI_MODELS:
            raise ValueError(f"Model {model} not supported")
        if not AI_MODELS[model]:
            raise ValueError(f"{model} API key/token not configured")

        # Get AI response
        start_time = datetime.datetime.now()
        try:
            ai_response = ai_handler.generate_response(model, message)
        except ValueError as e:
            logger.error(f"Model {model} generation error: {str(e)}")
            return jsonify({"error": f"Failed to generate response: {str(e)}"}), 500
            
        response_time = (datetime.datetime.now() - start_time).total_seconds()
        
        logger.info(f"Generated response in {response_time:.2f} seconds using {model}")
        
        timestamp = datetime.datetime.now().isoformat()

        # Initialize chat storage if needed
        if 'chat_sessions' not in session:
            session['chat_sessions'] = {}
            session.modified = True
        
        # Create new chat if needed
        if not chat_id or chat_id not in session['chat_sessions']:
            chat_id = str(uuid.uuid4())
            session['chat_sessions'][chat_id] = {
                "title": f"Chat {message[:20]}..." if len(message) > 20 else f"Chat {message}",
                "created_at": timestamp,
                "messages": []
            }
        
        # Add user message
        user_message = {
            "id": str(uuid.uuid4()),
            "content": message,
            "sender": "user",
            "timestamp": timestamp,
            "model": model
        }
        session['chat_sessions'][chat_id]["messages"].append(user_message)
        
        # Add AI response
        ai_message = {
            "id": str(uuid.uuid4()),
            "content": ai_response,
            "sender": "ai",
            "timestamp": timestamp,
            "model": model
        }
        session['chat_sessions'][chat_id]["messages"].append(ai_message)
        
        session.modified = True

        # Store in Drive if connected
        if is_drive_connected():
            store_chat_in_drive(chat_id, session['chat_sessions'][chat_id])

        return jsonify({
            "response": ai_response,
            "chat_id": chat_id,
            "timestamp": timestamp,
            "message": ai_message,
            "response_time": response_time
        })

    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/chats', methods=['GET'])
def list_chats():
    """Returns a list of all available chats"""
    try:
        chats = []
        
        # Get in-memory chats
        if 'chat_sessions' in session:
            for chat_id, chat_data in session['chat_sessions'].items():
                chats.append({
                    "id": chat_id,
                    "title": chat_data.get("title", f"Chat {chat_id}"),
                    "created_at": chat_data.get("created_at", datetime.datetime.now().isoformat())
                })

        # Get Drive chats if authenticated
        if is_drive_connected():
            drive_service = get_drive_service()
            if drive_service:
                query = f"mimeType='application/json' and '{session['drive_folder_id']}' in parents and trashed=false"
                files = drive_service.files().list(
                    q=query,
                    fields="files(id,name,createdTime)",
                    pageSize=100
                ).execute().get('files', [])
                
                for f in files:
                    try:
                        if f['name'].startswith('chat_') and f['name'].endswith('.json'):
                            chat_id = f['name'][5:-5]  # Remove 'chat_' prefix and '.json' suffix
                            if not any(c['id'] == chat_id for c in chats):
                                chats.append({
                                    "id": chat_id,
                                    "title": f"Chat {chat_id}",
                                    "created_at": f.get('createdTime', datetime.datetime.now().isoformat())
                                })
                    except Exception as e:
                        logger.error(f"Error processing file {f.get('name')}: {str(e)}")
                        continue
        
        # Sort chats by creation date (newest first)
        sorted_chats = sorted(chats, key=lambda x: x.get('created_at', ''), reverse=True)
        return jsonify({"chats": sorted_chats})
    except Exception as e:
        logger.error(f"Error listing chats: {str(e)}")
        return jsonify({"error": "Failed to list chats"}), 500

@app.route('/api/chat/<chat_id>', methods=['GET'])
def get_chat(chat_id):
    """Retrieves a specific chat's messages"""
    try:
        # Check in-memory first
        if 'chat_sessions' in session and chat_id in session['chat_sessions']:
            chat_data = session['chat_sessions'][chat_id]
            return jsonify({
                "status": "success",
                "chat_id": chat_id,
                "title": chat_data.get("title", f"Chat {chat_id}"),
                "created_at": chat_data.get("created_at"),
                "messages": chat_data.get("messages", []),
                "source": "memory"
            })
            
        # Check Drive storage
        chat_data = fetch_chat_from_drive(chat_id)
        if chat_data:
            return jsonify({
                "status": "success",
                "chat_id": chat_id,
                "title": chat_data.get("title", f"Chat {chat_id}"),
                "created_at": chat_data.get("created_at"),
                "messages": chat_data.get("messages", []),
                "source": "drive"
            })
            
        return jsonify({
            "status": "error",
            "message": "Chat not found",
            "details": f"Could not find chat with ID: {chat_id}"
        }), 404
        
    except Exception as e:
        logger.error(f"Error getting chat {chat_id}: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Failed to retrieve chat",
            "details": str(e)
        }), 500

@app.route('/api/chat/<chat_id>', methods=['DELETE'])
def delete_chat(chat_id):
    """Deletes a specific chat"""
    try:
        deleted_from = []
        
        # Remove from in-memory
        if 'chat_sessions' in session and chat_id in session['chat_sessions']:
            session['chat_sessions'].pop(chat_id)
            session.modified = True
            deleted_from.append("memory")
            
        # Remove from Drive
        if is_drive_connected():
            drive_service = get_drive_service()
            if drive_service:
                query = f"name='chat_{chat_id}.json' and '{session['drive_folder_id']}' in parents and trashed=false"
                files = drive_service.files().list(q=query, fields="files(id)").execute().get('files', [])
                
                for file in files:
                    drive_service.files().delete(fileId=file['id']).execute()
                    deleted_from.append("drive")
        
        if not deleted_from:
            return jsonify({
                "status": "error",
                "message": "Chat not found",
                "details": f"No chat found with ID: {chat_id}"
            }), 404
            
        return jsonify({
            "status": "success",
            "deleted_from": deleted_from
        })
    except Exception as e:
        logger.error(f"Error deleting chat {chat_id}: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/session-debug', methods=['GET'])
def session_debug():
    """Debug endpoint to check session status"""
    return jsonify({
        "session_id": session.sid,
        "models_configured": {
            "cohere": bool(AI_MODELS["cohere"]),
            "llama": bool(AI_MODELS["llama"])
        }
    })

if __name__ == '__main__':
    if not os.path.exists(app.config['SESSION_FILE_DIR']):
        os.makedirs(app.config['SESSION_FILE_DIR'], exist_ok=True)
    
    # Verify environment
    logger.info(f"Cohere configured: {bool(AI_MODELS['cohere'])}")
    logger.info(f"Llama configured: {bool(AI_MODELS['llama'])}")
    
    app.run(debug=True, port=5000)