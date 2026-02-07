import React, { useState, useEffect } from 'react';
import { 
  TextField, Button, Container, Typography, Alert, 
  Box, CircularProgress, Divider, Avatar, Fade, Grow,
  Dialog, DialogActions, DialogContent, DialogTitle 
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { GoogleLogin } from '@react-oauth/google';
import { Link, useNavigate } from 'react-router-dom';
import { 
  auth, 
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword
} from './firebase';
import { motion } from 'framer-motion';
import { styled } from '@mui/material/styles';
import { LockOutlined, Visibility, VisibilityOff } from '@mui/icons-material';

// Gradient colors
const gradientColors = {
  primary: '#0f0c29',
  secondary: '#302b63',
  tertiary: '#24243e'
};

// Styled components
const GlassCard = styled('div')(({ theme }) => ({
  width: '100%',
  maxWidth: '480px',
  padding: theme.spacing(4),
  background: `linear-gradient(135deg, ${alpha(gradientColors.primary, 0.9)} 0%, ${alpha(gradientColors.secondary, 0.9)} 50%, ${alpha(gradientColors.tertiary, 0.9)} 100%)`,
  backdropFilter: 'blur(12px)',
  borderRadius: '24px',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  boxShadow: '0 15px 35px rgba(0, 0, 0, 0.3)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
  },
}));

const GradientButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: '#fff',
  fontWeight: 'bold',
  letterSpacing: '1px',
  padding: theme.spacing(1.5),
  borderRadius: '12px',
  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
  transition: 'all 0.3s ease',
  textTransform: 'uppercase',
  '&:hover': {
    background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
    boxShadow: '0 6px 20px rgba(118, 75, 162, 0.5)',
    transform: 'translateY(-2px)',
  },
  '&:disabled': {
    background: 'rgba(118, 75, 162, 0.5)',
  }
}));

const AnimatedInput = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    color: '#fff',
    transition: 'all 0.3s ease',
    background: `linear-gradient(135deg, ${alpha(gradientColors.primary, 0.8)} 0%, ${alpha(gradientColors.secondary, 0.8)} 50%, ${alpha(gradientColors.tertiary, 0.8)} 100%)`,
    '& fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#667eea',
      boxShadow: '0 0 0 2px rgba(102, 126, 234, 0.2)',
    },
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#667eea',
  },
}));

function PopupPermission({ open, onClose }) {
  useEffect(() => {
    if (open) {
      const testPopup = window.open('', '_blank', 'width=100,height=100');
      if (testPopup) testPopup.close();
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Popup Permission Required</DialogTitle>
      <DialogContent>
        <p>Please allow popups for this site to continue with Google Sign-In.</p>
        <ol>
          <li>Click the lock icon in your browser's address bar</li>
          <li>Select "Site settings"</li>
          <li>Change "Pop-ups and redirects" to "Allow"</li>
        </ol>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>I've Enabled Popups</Button>
      </DialogActions>
    </Dialog>
  );
}

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPopupHelp, setShowPopupHelp] = useState(false);
  const [authWindow, setAuthWindow] = useState(null);
  const navigate = useNavigate();

  // Check auth status periodically
  useEffect(() => {
    if (!authWindow) return;

    const interval = setInterval(async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const idToken = await user.getIdToken();
        const response = await fetch('/api/google-auth/status', {
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.authenticated) {
            clearInterval(interval);
            authWindow.close();
            navigate('/chat');
          }
        }
      } catch (error) {
        console.error('Auth status check error:', error);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [authWindow, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/chat');
    } catch (error) {
      setError(error.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async (credentialResponse) => {
    setGoogleLoading(true);
    setError('');
    try {
      // First authenticate with Firebase
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const idToken = await user.getIdToken();

      // Initiate Google Drive auth
      const authResponse = await fetch('/api/google-auth', {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });

      if (!authResponse.ok) {
        throw new Error('Failed to initiate Google auth');
      }

      const { authorization_url } = await authResponse.json();
      const windowFeatures = 'width=500,height=600,left=100,top=100';
      const win = window.open(authorization_url, '_blank', windowFeatures);
      setAuthWindow(win);

    } catch (error) {
      console.error('Google auth error:', error);
      if (error.code === 'auth/popup-blocked') {
        setShowPopupHelp(true);
      }
      setError(error.message || 'Google authentication failed');
      setGoogleLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Container maxWidth={false} sx={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: `linear-gradient(135deg, ${gradientColors.primary} 0%, ${gradientColors.secondary} 50%, ${gradientColors.tertiary} 100%)`,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated background elements */}
      <motion.div
        style={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          width: '150px',
          height: '150px',
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(102,126,234,0.2) 0%, rgba(102,126,234,0) 70%)`,
          zIndex: 1
        }}
        animate={{
          y: [0, -30, 0],
          opacity: [0.6, 0.9, 0.6]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {showPopupHelp && <PopupPermission open={showPopupHelp} onClose={() => setShowPopupHelp(false)} />}
      
      <Grow in={true} timeout={800}>
        <GlassCard>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Box display="flex" justifyContent="center" mb={3}>
              <Avatar sx={{
                bgcolor: 'transparent',
                width: 80,
                height: 80,
                border: '2px solid rgba(102, 126, 234, 0.8)',
                boxShadow: '0 0 20px rgba(102, 126, 234, 0.5)',
                background: `linear-gradient(135deg, rgba(15, 12, 41, 0.8) 0%, rgba(48, 43, 99, 0.8) 100%)`
              }}>
                <LockOutlined sx={{ fontSize: 40, color: '#fff' }} />
              </Avatar>
            </Box>

            <Typography 
              variant="h4" 
              align="center" 
              fontWeight={700} 
              gutterBottom
              sx={{ 
                color: '#fff',
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
              }}
            >
              Welcome Back
            </Typography>
            
            <Typography 
              variant="body1" 
              align="center" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.7)', 
                mb: 3 
              }}
            >
              Sign in to access your chat interface
            </Typography>

            {error && (
              <Fade in={!!error}>
                <Alert 
                  severity="error" 
                  sx={{ 
                    mb: 3,
                    borderRadius: '12px',
                    background: `linear-gradient(135deg, rgba(255, 0, 0, 0.2) 0%, rgba(204, 0, 0, 0.2) 100%)`,
                    color: '#fff',
                    border: '1px solid rgba(255, 0, 0, 0.3)'
                  }}
                >
                  {error}
                </Alert>
              </Fade>
            )}

            <form onSubmit={handleSubmit}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <AnimatedInput
                  label="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  fullWidth
                  variant="outlined"
                  margin="normal"
                  required
                  type="email"
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 1, color: 'rgba(255, 255, 255, 0.7)' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </Box>
                    ),
                  }}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <AnimatedInput
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  fullWidth
                  variant="outlined"
                  margin="normal"
                  required
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 1, color: 'rgba(255, 255, 255, 0.7)' }}>
                        <LockOutlined fontSize="small" />
                      </Box>
                    ),
                    endAdornment: (
                      <Box 
                        sx={{ color: 'rgba(255, 255, 255, 0.7)', cursor: 'pointer' }}
                        onClick={togglePasswordVisibility}
                      >
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </Box>
                    ),
                  }}
                />
              </motion.div>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                <Link 
                  to="/forgot-password" 
                  style={{ 
                    color: 'rgba(102, 126, 234, 0.8)',
                    fontSize: '0.875rem',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  Forgot password?
                </Link>
              </Box>

              <Box mt={2}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <GradientButton
                    type="submit"
                    fullWidth
                    disabled={loading || googleLoading}
                  >
                    {loading ? (
                      <CircularProgress size={24} sx={{ color: '#fff' }} />
                    ) : (
                      'Sign In'
                    )}
                  </GradientButton>
                </motion.div>
              </Box>
            </form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Divider sx={{ 
                my: 3, 
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                '&::before, &::after': {
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                }
              }}>
                <Typography variant="body2" sx={{ 
                  color: 'rgba(255, 255, 255, 0.7)', 
                  px: 2,
                  background: `linear-gradient(135deg, rgba(15, 12, 41, 0.9) 0%, rgba(48, 43, 99, 0.9) 100%)`,
                  borderRadius: '12px'
                }}>
                  OR SIGN IN WITH
                </Typography>
              </Divider>

              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                {googleLoading ? (
                  <CircularProgress sx={{ color: '#fff' }} />
                ) : (
                  <GoogleLogin
                    onSuccess={handleGoogleSignIn}
                    onError={() => setError("Google sign-in failed")}
                    theme="filled_blue"
                    size="large"
                    shape="pill"
                  />
                )}
              </Box>

              <Typography 
                align="center" 
                variant="body2" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  '& a': {
                    color: '#667eea',
                    fontWeight: 'bold',
                    textDecoration: 'none',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      textDecoration: 'underline',
                    }
                  }
                }}
              >
                Don't have an account? <Link to="/signup">Sign Up</Link>
              </Typography>
            </motion.div>
          </motion.div>
        </GlassCard>
      </Grow>
    </Container>
  );
};

export default SignIn;