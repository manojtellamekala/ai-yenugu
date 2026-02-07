import React, { useState } from 'react';
import { 
  TextField, Button, Container, Typography, Alert, 
  Box, CircularProgress, Divider, Avatar, Fade
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from './firebase';
import { sendPasswordResetEmail } from "firebase/auth";
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';
import LockResetIcon from '@mui/icons-material/LockReset';

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

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailChange = (e) => setEmail(e.target.value);

  const handleResetLink = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent! Check your inbox.");
      // Add a delay before navigation for better UX
      setTimeout(() => {
        navigate('/signin');
      }, 3000);
    } catch (error) {
      setError(error.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
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
              <LockResetIcon sx={{ fontSize: 40, color: '#fff' }} />
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
            Reset Your Password
          </Typography>
          
          <Typography 
            variant="body1" 
            align="center" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.7)', 
              mb: 3 
            }}
          >
            Enter your email address and we'll send you a link to reset your password.
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

          {message && (
            <Fade in={!!message}>
              <Alert 
                severity="success" 
                sx={{ 
                  mb: 3,
                  borderRadius: '12px',
                  background: `linear-gradient(135deg, rgba(0, 255, 0, 0.2) 0%, rgba(0, 204, 0, 0.2) 100%)`,
                  color: '#fff',
                  border: '1px solid rgba(0, 255, 0, 0.3)'
                }}
              >
                {message}
              </Alert>
            </Fade>
          )}

          <form onSubmit={handleResetLink}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <AnimatedInput
                label="Email Address"
                value={email}
                onChange={handleEmailChange}
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

            <Box mt={2}>
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
                    'Send Reset Link'
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
            <Typography 
              align="center" 
              variant="body2" 
              sx={{ 
                mt: 3,
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
              Remember your password? <Link to="/signin">Sign In</Link>
            </Typography>
          </motion.div>
        </motion.div>
      </GlassCard>
    </Container>
  );
};

export default ForgotPassword;