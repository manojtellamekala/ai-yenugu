import React, { useState } from 'react';
import { 
  TextField, Button, Container, Typography, Alert, 
  Box, CircularProgress, Divider, Avatar, Fade, Grow 
} from '@mui/material';
import { GoogleLogin } from '@react-oauth/google';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from './firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { motion } from 'framer-motion';
import { styled } from '@mui/material/styles';
import { LockOutlined, PersonAddOutlined, Visibility, VisibilityOff } from '@mui/icons-material';

// Premium styled components
const GlassCard = styled('div')(({ theme }) => ({
  width: '100%',
  maxWidth: '480px',
  padding: theme.spacing(4),
  background: 'rgba(255, 255, 255, 0.1)',
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

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate('/chat');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Container 
      maxWidth={false} 
      sx={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Animated background elements */}
      <motion.div
        style={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          width: '150px',
          height: '150px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(102,126,234,0.2) 0%, rgba(102,126,234,0) 70%)',
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
      
      <motion.div
        style={{
          position: 'absolute',
          bottom: '25%',
          right: '15%',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(118,75,162,0.2) 0%, rgba(118,75,162,0) 70%)',
          zIndex: 1
        }}
        animate={{
          y: [0, 30, 0],
          opacity: [0.5, 0.8, 0.5]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

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
              }}>
                <PersonAddOutlined sx={{ fontSize: 40, color: '#fff' }} />
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
              Create Account
            </Typography>
            
            <Typography 
              variant="body1" 
              align="center" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.7)', 
                mb: 3 
              }}
            >
              Join our premium community today
            </Typography>

            {error && (
              <Fade in={!!error}>
                <Alert 
                  severity="error" 
                  sx={{ 
                    mb: 3,
                    borderRadius: '12px',
                    background: 'rgba(255, 0, 0, 0.15)',
                    color: '#fff'
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

              <Box mt={3}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <GradientButton
                    type="submit"
                    fullWidth
                    disabled={loading}
                  >
                    {loading ? (
                      <CircularProgress size={24} sx={{ color: '#fff' }} />
                    ) : (
                      'Create Account'
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
              <Divider sx={{ my: 3, bgcolor: 'rgba(255, 255, 255, 0.2)' }}>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', px: 2 }}>
                  OR SIGN UP WITH
                </Typography>
              </Divider>

              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <GoogleLogin
                  onSuccess={(response) => {
                    fetch("http://localhost:5000/api/drive-signup", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ token: response.credential }),
                    }).then(() => navigate("/chat"));
                  }}
                  onError={() => setError("Google sign-up failed")}
                  theme="filled_blue"
                  size="large"
                  shape="pill"
                />
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
                Already have an account? <Link to="/signin">Sign In</Link>
              </Typography>
            </motion.div>
          </motion.div>
        </GlassCard>
      </Grow>
    </Container>
  );
};

export default SignUp;