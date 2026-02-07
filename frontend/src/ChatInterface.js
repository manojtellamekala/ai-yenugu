import React, { useState, useEffect, useRef } from 'react';
import { FiPlus, FiTrash2, FiCopy, FiMenu, FiX, FiSun, FiMoon, FiStar, FiRefreshCw, FiSearch, FiDownload, FiArrowUp } from 'react-icons/fi';
import { BsRobot } from 'react-icons/bs';
import { SiHuggingface } from 'react-icons/si';
import { FaGoogleDrive } from 'react-icons/fa';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark, prism } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Snackbar, Alert, CircularProgress, Tooltip } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import { inSphere } from 'maath/random/dist/maath-random.esm';
import './ChatInterface.css';
import { jsPDF } from 'jspdf';

// Premium Galaxy Background Component
const GalaxyBackground = () => {
  const ref = useRef();
  const [sphere] = useState(() => {
    const points = new Float32Array(20000);
    return inSphere(points, { radius: 3 });
  });
  
  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 6;
      ref.current.rotation.y -= delta / 10;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#8B5CF6"
          size={0.01}
          sizeAttenuation={true}
          depthWrite={false}
          blending={1}
        />
      </Points>
    </group>
  );
};

// Floating Stars Component
const FloatingStars = () => {
  return (
    <div className="floating-stars">
      {[...Array(50)].map((_, i) => (
        <div 
          key={i}
          className="star"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            width: `${Math.random() * 3 + 1}px`,
            height: `${Math.random() * 3 + 1}px`,
            opacity: Math.random() * 0.5 + 0.5,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${Math.random() * 10 + 5}s`
          }}
        />
      ))}
    </div>
  );
};

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('llama'); // Default to llama
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [theme, setTheme] = useState('night');
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isThemeTransitioning, setIsThemeTransitioning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [storageMode, setStorageMode] = useState('local'); // 'local' or 'drive'

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const sidebarRef = useRef(null);

  // Updated models configuration to match backend
  const aiModels = [
    { id: 'cohere', name: 'Cohere', icon: <BsRobot /> },
    { id: 'llama', name: 'Llama 2', icon: <SiHuggingface /> }
  ];

  // Filter chat history based on search query
  const filteredChatHistory = chatHistory.filter(chat => 
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check if Drive is connected
        await checkAuthStatus();
        
        // Load from localStorage first
        loadFromLocalStorage();
        
        // If Drive is connected, try to sync
        if (isDriveConnected) {
          await fetchChatHistory();
        }
      } catch (error) {
        console.error('Initialization error:', error);
        showSnackbar('Failed to initialize application', 'error');
      }
    };
    initializeApp();

    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      
      try {
        const messageData = typeof event.data === 'string' ? 
          JSON.parse(event.data) : 
          event.data;

        if (!messageData?.type) return;
        
        switch (messageData.type) {
          case 'auth-success':
            handleAuthSuccess();
            break;
          case 'auth-error':
            handleAuthError(messageData.error);
            break;
          default:
            console.warn('Unknown message type:', messageData.type);
        }
      } catch (error) {
        console.error('Error processing message:', error);
        showSnackbar('Error processing authentication', 'error');
        setIsAuthenticating(false);
      }
    };

    const handleAuthSuccess = async () => {
      const connected = await checkAuthStatus();
      if (connected) {
        setIsDriveConnected(true);
        showSnackbar('Google Drive connected successfully', 'success');
        await fetchChatHistory();
      }
    };

    const handleAuthError = (error = 'Unknown error') => {
      showSnackbar(`Drive connection failed: ${error}`, 'error');
      setIsAuthenticating(false);
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
    scrollToBottom();
  }, [input, messages]);

  // Save to localStorage whenever chatHistory changes
  useEffect(() => {
    if (storageMode === 'local') {
      saveToLocalStorage();
    }
  }, [chatHistory, storageMode]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadFromLocalStorage = () => {
    try {
      const savedChats = localStorage.getItem('ai-chat-history');
      if (savedChats) {
        const parsedChats = JSON.parse(savedChats);
        setChatHistory(parsedChats);
        showSnackbar('Loaded chats from local storage', 'info');
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  };

  const saveToLocalStorage = () => {
    try {
      localStorage.setItem('ai-chat-history', JSON.stringify(chatHistory));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      showSnackbar('Failed to save chats locally', 'error');
    }
  };

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth-status', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to check auth status');
      const data = await response.json();
      setIsDriveConnected(data.drive_connected || false);
      if (data.drive_connected) {
        setStorageMode('drive');
      }
      return data.drive_connected;
    } catch (error) {
      console.error('Error checking auth status:', error);
      throw error;
    }
  };

  const connectGoogleDrive = async () => {
    setIsAuthenticating(true);
    try {
      await fetch('http://localhost:5000/api/logout', {
        credentials: 'include'
      });

      const authWindow = window.open(
        '',
        'GoogleAuth',
        'width=500,height=600,left=100,top=100'
      );

      const response = await fetch('http://localhost:5000/api/drive-login', {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to initiate drive login');
      const { auth_url } = await response.json();
      
      authWindow.location.href = auth_url;
      
      const checkAuth = setInterval(async () => {
        try {
          if (authWindow.closed) {
            clearInterval(checkAuth);
            const connected = await checkAuthStatus();
            if (connected) {
              showSnackbar('Google Drive connected successfully', 'success');
              await fetchChatHistory();
            } else {
              showSnackbar('Failed to connect Google Drive', 'error');
            }
            setIsAuthenticating(false);
          }
        } catch (error) {
          clearInterval(checkAuth);
          console.error('Auth check error:', error);
          showSnackbar('Connection verification failed', 'error');
          setIsAuthenticating(false);
        }
      }, 500);
      
    } catch (error) {
      console.error('Drive login error:', error);
      showSnackbar(`Drive connection failed: ${error.message}`, 'error');
      setIsAuthenticating(false);
    }
  };

  const fetchChatHistory = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/chats', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch chat history');
      const data = await response.json();
      setChatHistory(data.chats || []);
      setStorageMode('drive');
      showSnackbar('Loaded chats from Google Drive', 'info');
    } catch (error) {
      console.error('Error fetching chat history:', error);
      showSnackbar('Failed to load chat history from Drive', 'error');
      // Fall back to localStorage
      setStorageMode('local');
      loadFromLocalStorage();
    }
  };

  const saveChat = async (chatData) => {
    if (storageMode === 'drive' && isDriveConnected) {
      try {
        const response = await fetch('http://localhost:5000/api/save-chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(chatData),
        });
        
        if (!response.ok) throw new Error('Failed to save chat to Drive');
        return await response.json();
      } catch (error) {
        console.error('Error saving to Drive:', error);
        showSnackbar('Failed to save to Drive, using local storage', 'warning');
        setStorageMode('local');
        saveToLocalStorage();
      }
    } else {
      // Save to localStorage
      saveToLocalStorage();
    }
  };

  const createNewChat = () => {
    const newChat = {
      id: Date.now().toString(),
      title: `New Chat ${chatHistory.length + 1}`,
      createdAt: new Date().toISOString(),
      isStarred: false,
      messages: []
    };
    
    setChatHistory([newChat, ...chatHistory]);
    setActiveChat(newChat.id);
    setMessages([]);
    setSidebarOpen(false);
    
    // Save the new chat
    saveChat(newChat);
    showSnackbar('New chat created', 'success');
  };

  const toggleStarChat = (chatId, e) => {
    e.stopPropagation();
    const updatedChats = chatHistory.map(chat => 
      chat.id === chatId ? { ...chat, isStarred: !chat.isStarred } : chat
    );
    
    setChatHistory(updatedChats);
    
    // Save the updated chats
    if (storageMode === 'drive') {
      const chatToUpdate = updatedChats.find(chat => chat.id === chatId);
      if (chatToUpdate) {
        saveChat(chatToUpdate);
      }
    }
  };

  const loadChat = async (chatId) => {
    if (activeChat === chatId || isLoading) return;
    
    try {
      setIsLoading(true);
      setMessages([]);
      
      if (storageMode === 'drive' && isDriveConnected) {
        // Load from Drive
        const response = await fetch(`http://localhost:5000/api/chat/${chatId}`, {
          credentials: 'include'
        });
        
        if (!response.ok) throw new Error("Failed to load chat from Drive");

        const data = await response.json();
        
        const formattedMessages = data.messages.map((msg, index) => ({
          id: msg.id || `msg-${chatId}-${index}-${Date.now()}`,
          content: msg.content || '',
          sender: msg.sender || (msg.ai ? 'ai' : 'user'),
          model: msg.model || selectedModel,
          timestamp: msg.timestamp || new Date().toISOString()
        }));

        setMessages(formattedMessages);
      } else {
        // Load from localStorage
        const chatToLoad = chatHistory.find(chat => chat.id === chatId);
        if (chatToLoad && chatToLoad.messages) {
          setMessages(chatToLoad.messages);
        }
      }
      
      setActiveChat(chatId);
      
    } catch (error) {
      console.error('Error loading chat:', error);
      showSnackbar(`Failed to load chat: ${error.message}`, 'error');
      
      // Fallback to localStorage
      const chatToLoad = chatHistory.find(chat => chat.id === chatId);
      if (chatToLoad && chatToLoad.messages) {
        setMessages(chatToLoad.messages);
        setActiveChat(chatId);
      } else {
        setMessages([]);
        setActiveChat(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const deleteChat = async (chatId) => {
    try {
      setIsLoading(true);
      
      if (storageMode === 'drive' && isDriveConnected) {
        // Delete from Drive
        const response = await fetch(`http://localhost:5000/api/chat/${chatId}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to delete chat from Drive');
      }
      
      // Delete from local state
      const updatedChats = chatHistory.filter(c => c.id !== chatId);
      setChatHistory(updatedChats);
      
      if (activeChat === chatId) {
        setMessages([]);
        setActiveChat(null);
      }
      
      // Update storage
      if (storageMode === 'local') {
        saveToLocalStorage();
      }
      
      showSnackbar('Chat deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting chat:', error);
      showSnackbar('Failed to delete chat', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadChatAsPDF = (chatId) => {
    const chat = chatHistory.find(c => c.id === chatId);
    if (!chat) return;

    const messagesToDownload = messages.length > 0 ? messages : 
      (chat.messages || []).length > 0 ? chat.messages : [];

    if (messagesToDownload.length === 0) {
      showSnackbar('No messages to download', 'warning');
      return;
    }

    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(18);
    doc.text(chat.title, 105, y, { align: 'center' });
    y += 15;

    doc.setFontSize(12);
    doc.text(`Model: ${selectedModel}`, 14, y);
    y += 10;
    doc.text(`Date: ${new Date().toLocaleString()}`, 14, y);
    y += 15;

    messagesToDownload.forEach((message, index) => {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(12);
      doc.setTextColor(message.sender === 'user' ? '#4a6baf' : '#6a4aaf');
      doc.setFont('helvetica', message.sender === 'user' ? 'normal' : 'bold');
      doc.text(`${message.sender === 'user' ? 'You' : 'AI'}:`, 14, y);
      
      const lines = doc.splitTextToSize(message.content, 180);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.text(lines, 30, y + 5);
      
      y += (lines.length * 7) + 15;
      
      if (index < messagesToDownload.length - 1) {
        doc.setDrawColor(200, 200, 200);
        doc.line(14, y - 5, 196, y - 5);
        y += 5;
      }
    });

    doc.save(`chat_${chatId}.pdf`);
    showSnackbar('Chat downloaded as PDF', 'success');
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      content: input,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          message: input,
          model: selectedModel,
          chat_id: activeChat
        }),
      });

      if (!response.ok) throw new Error(await response.text());

      const data = await response.json();
      
      const aiMessage = {
        id: Date.now() + 1,
        content: data.response,
        sender: 'ai',
        model: selectedModel,
        timestamp: data.timestamp,
      };
      
      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);

      // Update chat history
      let chatId = activeChat;
      if (!activeChat && data.chat_id) {
        chatId = data.chat_id;
        const newChat = {
          id: chatId,
          title: `Chat ${input.substring(0, 20)}...`,
          createdAt: new Date().toISOString(),
          isStarred: false,
          messages: finalMessages
        };
        setChatHistory([newChat, ...chatHistory]);
        setActiveChat(chatId);
        
        // Save the new chat
        saveChat(newChat);
      } else if (activeChat) {
        // Update existing chat
        const updatedChats = chatHistory.map(chat => 
          chat.id === activeChat 
            ? { ...chat, messages: finalMessages }
            : chat
        );
        setChatHistory(updatedChats);
        
        // Save the updated chat
        const chatToUpdate = updatedChats.find(chat => chat.id === activeChat);
        if (chatToUpdate) {
          saveChat(chatToUpdate);
        }
      }

    } catch (error) {
      console.error('Error sending message:', error);
      showSnackbar('Failed to get AI response', 'error');
      setMessages(messages);
    } finally {
      setIsLoading(false);
    }
  };

  const formatMessageContent = (content) => {
    if (!content) return null;
    
    return content.split(/(```[\s\S]*?```)/g).map((part, i) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const code = part.replace(/```[\w]*\n?/, '').replace(/\n?```$/, '');
        const languageMatch = part.match(/```(\w+)/);
        const language = languageMatch ? languageMatch[1] : 'javascript';
        
        return (
          <div key={i} className="code-block-wrapper">
            <SyntaxHighlighter
              language={language}
              style={theme === 'night' ? atomDark : prism}
              className="code-block"
              showLineNumbers={true}
              wrapLines={true}
            >
              {code}
            </SyntaxHighlighter>
            <button
              className="copy-code-btn"
              onClick={() => copyToClipboard(code)}
            >
              <FiCopy size={14} /> Copy
            </button>
          </div>
        );
      }
      
      return (
        <div key={i} className="message-text">
          {part.split('\n\n').map((paragraph, pIndex) => (
            <p key={pIndex} className="message-paragraph">
              {paragraph.split('\n').map((line, lIndex, lines) => (
                <React.Fragment key={lIndex}>
                  {line}
                  {lIndex < lines.length - 1 && <br />}
                </React.Fragment>
              ))}
            </p>
          ))}
        </div>
      );
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showSnackbar('Copied to clipboard!', 'success');
  };

  const toggleTheme = () => {
    setIsThemeTransitioning(true);
    setTimeout(() => {
      setTheme(theme === 'day' ? 'night' : 'day');
      setIsThemeTransitioning(false);
    }, 300);
  };

  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const syncWithDrive = async () => {
    if (!isDriveConnected) {
      showSnackbar('Please connect Google Drive first', 'warning');
      return;
    }
    
    try {
      setIsLoading(true);
      // Upload local chats to Drive
      for (const chat of chatHistory) {
        await saveChat(chat);
      }
      showSnackbar('Chats synced with Google Drive', 'success');
    } catch (error) {
      console.error('Error syncing with Drive:', error);
      showSnackbar('Failed to sync with Google Drive', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      className={`chat-app theme-${theme}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="galaxy-background">
        <Canvas camera={{ position: [0, 0, 3], fov: 70 }}>
          <GalaxyBackground />
        </Canvas>
        <FloatingStars />
      </div>

      <motion.div 
        ref={sidebarRef}
        className={`sidebar ${sidebarOpen ? 'open' : ''} ultra-transparent`}
        initial={{ x: -300 }}
        animate={{ x: sidebarOpen ? 0 : -300 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="sidebar-header">
          <div className="sidebar-header-content">
            <h2>AI Chat</h2>
            <button 
              className="close-sidebar" 
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        <div className="sidebar-search">
          <div className="search-container">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="sidebar-actions">
          <motion.button 
            className="new-chat-btn hover-glow" 
            onClick={createNewChat}
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FiPlus /> New Chat
          </motion.button>

          {isDriveConnected ? (
            <motion.button 
              className="drive-sync-btn hover-glow"
              onClick={syncWithDrive}
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FiRefreshCw size={16} />
              Sync with Drive
            </motion.button>
          ) : (
            <motion.button 
              className="drive-connect-btn hover-glow"
              onClick={connectGoogleDrive}
              disabled={isAuthenticating}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isAuthenticating ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <>
                  <FaGoogleDrive className="drive-icon" />
                  Connect Drive
                </>
              )}
            </motion.button>
          )}
        </div>

        <div className="storage-indicator">
          <span className={`storage-badge ${storageMode}`}>
            {storageMode === 'drive' ? 'Google Drive' : 'Local Storage'}
          </span>
        </div>

        <div className="chat-history">
          {filteredChatHistory.length > 0 ? (
            <>
              <div className="chat-history-header">
                <h3>Recent Chats</h3>
                <span>{filteredChatHistory.length} chats</span>
              </div>
              
              {filteredChatHistory.map((chat) => (
                <motion.div
                  key={chat.id}
                  className={`chat-item ${activeChat === chat.id ? 'active' : ''}`}
                  onClick={() => loadChat(chat.id)}
                  whileHover={{ scale: 1.01 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="chat-item-content">
                    <button
                      className={`star-btn ${chat.isStarred ? 'starred' : ''}`}
                      onClick={(e) => toggleStarChat(chat.id, e)}
                    >
                      <FiStar size={14} />
                    </button>
                    <span className="chat-title">{chat.title}</span>
                  </div>
                  <div className="chat-item-actions">
                    <Tooltip title="Download chat as PDF">
                      <button
                        className="chat-item-download"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadChatAsPDF(chat.id);
                        }}
                        disabled={isLoading}
                        aria-label={`Download chat ${chat.title}`}
                      >
                        <FiDownload size={14} />
                      </button>
                    </Tooltip>
                    <Tooltip title="Delete chat">
                      <button
                        className="chat-item-delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteChat(chat.id);
                        }}
                        disabled={isLoading}
                        aria-label={`Delete chat ${chat.title}`}
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </Tooltip>
                  </div>
                </motion.div>
              ))}
            </>
          ) : (
            <div className="no-chats-message">
              {storageMode === 'drive' ? 'No chats found in Drive' : 'No local chats found'}
            </div>
          )}
        </div>

        <div className="sidebar-footer">
          <div className="model-selector-container">
            <label htmlFor="model-selector">AI Model:</label>
            <select
              id="model-selector"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={isLoading}
            >
              {aiModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>

          <div className="footer-actions">
            <motion.button 
              className="theme-toggle" 
              onClick={toggleTheme}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              aria-label={`Toggle ${theme === 'day' ? 'dark' : 'light'} mode`}
            >
              {theme === 'day' ? <FiMoon size={18} /> : <FiSun size={18} />}
              {theme === 'day' ? 'Dark' : 'Light'} Mode
            </motion.button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isThemeTransitioning && (
          <motion.div
            className="theme-transition-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>

      <div className="main-content ultra-transparent">
        <div className="chat-header">
          <div className="chat-header-left">
            <motion.button 
              className="menu-button" 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              disabled={isLoading}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label={sidebarOpen ? "Close menu" : "Open menu"}
            >
              {sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
            </motion.button>
            
            <h2>
              {activeChat 
                ? chatHistory.find(c => c.id === activeChat)?.title 
                : 'New Chat'}
            </h2>
          </div>

          <div className="chat-header-right">
            <div className="connection-status">
              {isDriveConnected ? (
                <span className="connected">
                  <span className="status-dot"></span>
                  Drive Connected
                </span>
              ) : (
                <span className="disconnected">
                  <span className="status-dot"></span>
                  Not Connected
                </span>
              )}
            </div>

            <div className="model-switcher">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={isLoading}
              >
                {aiModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="storage-indicator-header">
              <span className={`storage-badge ${storageMode}`}>
                {storageMode === 'drive' ? 'Google Drive' : 'Local Storage'}
              </span>
            </div>
          </div>
        </div>

        <div className="chat-messages">
          {messages.length === 0 ? (
            <motion.div 
              className="welcome-message"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="welcome-content">
                <h3>Welcome to AI Chat</h3>
                <p>
                  {isDriveConnected
                    ? "Your chats are being saved to Google Drive. Select a model and start chatting!"
                    : "Your chats are being saved locally. Connect Google Drive to sync across devices."}
                </p>
                
                <div className="model-highlights">
                  {aiModels.map(model => (
                    <div key={model.id} className="model-card">
                      {model.icon}
                      <h4>{model.name}</h4>
                      <p>
                        {model.id === 'cohere' 
                          ? 'Advanced reasoning and analysis' 
                          : 'Open source powerful model'}
                      </p>
                    </div>
                  ))}
                </div>

                {!isDriveConnected && (
                  <motion.button 
                    className="connect-btn hover-glow"
                    onClick={connectGoogleDrive}
                    disabled={isAuthenticating}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isAuthenticating ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <>
                        <FaGoogleDrive /> Connect Google Drive
                      </>
                    )}
                  </motion.button>
                )}
              </div>
            </motion.div>
          ) : (
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  className={`message ${message.sender === 'user' ? 'user-message' : 'ai-message'}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="message-content">
                    {message.sender === 'ai' && (
                      <div className="ai-model-badge">
                        {aiModels.find(m => m.id === (message.model || selectedModel))?.icon}
                        <span>
                          {aiModels.find(m => m.id === (message.model || selectedModel))?.name}
                        </span>
                      </div>
                    )}
                    
                    {formatMessageContent(message.content)}
                    
                    <div className="message-actions">
                      <span className="message-time">
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {message.sender === 'ai' && (
                        <div className="action-buttons">
                          <Tooltip title="Copy to clipboard">
                            <button
                              className="message-action-btn"
                              onClick={() => copyToClipboard(message.content)}
                              aria-label="Copy message"
                            >
                              <FiCopy size={14} />
                            </button>
                          </Tooltip>
                          <Tooltip title="Regenerate response">
                            <button
                              className="message-action-btn"
                              onClick={() => {}}
                              aria-label="Regenerate response"
                            >
                              <FiRefreshCw size={14} />
                            </button>
                          </Tooltip>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {isLoading && (
            <motion.div 
              className="ai-message"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="message-content">
                <div className="ai-model-badge">
                  {aiModels.find(m => m.id === selectedModel)?.icon}
                  <span>
                    {aiModels.find(m => m.id === selectedModel)?.name}
                  </span>
                </div>
                <div className="loading-dots">
                  <div className="loading-dot"></div>
                  <div className="loading-dot"></div>
                  <div className="loading-dot"></div>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          <div className="input-container">
            <textarea
              ref={textareaRef}
              className="message-input"
              placeholder={`Message ${aiModels.find(m => m.id === selectedModel)?.name}...`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={isLoading}
              aria-label="Chat input"
            />
            <motion.button
              className="send-btn hover-glow"
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Send message"
            >
              <FiArrowUp size={20} />
            </motion.button>
          </div>
          <div className="input-footer">
            <span className="model-info">
              Using: {aiModels.find(m => m.id === selectedModel)?.name}
            </span>
            <span className="storage-info">
              Saving to: {storageMode === 'drive' ? 'Google Drive' : 'Local Storage'}
            </span>
          </div>
        </div>
      </div>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity={snackbarSeverity}
            sx={{ width: '100%' }}
            elevation={6}
          >
            {snackbarMessage}
          </Alert>
        </motion.div>
      </Snackbar>
    </motion.div>
  );
};

export default ChatInterface;