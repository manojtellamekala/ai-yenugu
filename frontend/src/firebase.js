import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  signInWithEmailAndPassword 
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBX6AOjpR8WhCKjfhZOWPgxlAIqQS4RC9c",
  authDomain: "chatgpt-74989.firebaseapp.com",
  projectId: "chatgpt-74989",
  storageBucket: "chatgpt-74989.appspot.com",
  messagingSenderId: "188358362731",
  appId: "1:188358362731:web:059e4c5129742060ad532e"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { 
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword
};