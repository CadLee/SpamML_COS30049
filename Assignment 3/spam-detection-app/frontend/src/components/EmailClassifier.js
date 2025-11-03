import React, { useState } from 'react';
import {
  Paper, TextField, Button, Box, Typography, Alert, CircularProgress,
  Card, CardContent, Chip, Grid, LinearProgress, Collapse, IconButton
} from '@mui/material';
import {
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Clear as ClearIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import axios from 'axios';

function EmailClassifier({ onPrediction }) {
  const [emailText, setEmailText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [showExamples, setShowExamples] = useState(true);

  const characterCount = emailText.length;
  const wordCount = emailText.trim().split(/\s+/).filter(Boolean).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!emailText.trim()) {
      setError('Please enter email text');
      return;
    }

    if (emailText.trim().length < 10) {
      setError('Email text is too short. Please enter at least 10 characters.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await axios.post('http://localhost:8000/predict', {
        text: emailText
      });

      const prediction = {
        ...response.data,
        timestamp: new Date().toISOString(),
        text: emailText
      };

      setResult(prediction);
      onPrediction(prediction);
      setShowExamples(false);

    } catch (err) {
      console.error('Prediction error:', err);
      if (err.response) {
        setError(err.response?.data?.detail || 'Failed to classify email. Please try again.');
      } else if (err.request) {
        setError('Cannot connect to server. Please ensure the backend is running on http://localhost:8000');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setEmailText('');
    setResult(null);
    setError('');
    setShowExamples(true);
  };

  const exampleEmails = [
    {
      label: "Spam Example 1",
      text: "CONGRATULATIONS!!! You've WON $1,000,000! Click here immediately to claim your prize NOW! Limited time offer!"
    },
    {
      label: "Ham Example 1",
      text: "Hi team, just a reminder that our meeting is scheduled for tomorrow at 2 PM in the conference room. Please bring your project updates."
    },
    {
      label: "Spam Example 2",
      text: "Dear customer, your account has been compromised. Verify your credentials immediately by clicking this link to avoid suspension."
    },
    {
      label: "Ham Example 2",
      text: "Thank you for your purchase. Your order #12345 has been confirmed and will be shipped within 2-3 business days."
    }
  ];

  const loadExample = (example) => {
    setEmailText(example);
    setResult(null);
    setError('');
  };

  const copyToClipboard = () => {
    if (result) {
      const text = `Prediction: ${result.prediction}\nConfidence: ${result.confidence_percentage.toFixed(2)}%\nEmail: ${result.text}`;
      navigator.clipboard.writeText(text);
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4, bgcolor: 'background.paper' }}>
        <Typography variant="h5" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
          📧 Email Classification
        </Typography>
        
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            multiline
            rows={6}
            variant="outlined"
            label="Enter email text"
            placeholder="Paste your email content here..."
            value={emailText}
            onChange={(e) => setEmailText(e.target.value)}
            sx={{ mb: 1 }}
            disabled={loading}
            error={error && !emailText.trim()}
          />

          {/* Character and Word Counter */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, px: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {characterCount} characters | {wordCount} words
            </Typography>
            {emailText.trim().length > 0 && emailText.trim().length < 10 && (
              <Typography variant="caption" color="error">
                Minimum 10 characters required
              </Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
              disabled={loading || !emailText.trim() || emailText.trim().length < 10}
              fullWidth
              size="large"
            >
              {loading ? 'Classifying...' : 'Classify Email'}
            </Button>
            <Button
              variant="outlined"
              onClick={handleClear}
              disabled={loading}
              startIcon={<ClearIcon />}
              sx={{ minWidth: 120 }}
            >
              Clear
            </Button>
          </Box>
        </form>

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Result Display */}
        {result && (
          <Card sx={{ 
            mt: 3, 
            bgcolor: result.prediction === 'Spam' ? '#fef2f2' : '#f0fdf4',
            border: '2px solid',
            borderColor: result.prediction === 'Spam' ? 'secondary.main' : 'success.main'
          }}>
            <CardContent>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {result.prediction === 'Spam' ? (
                      <WarningIcon color="error" sx={{ fontSize: 48 }} />
                    ) : (
                      <CheckCircleIcon color="success" sx={{ fontSize: 48 }} />
                    )}
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {result.prediction}
                      </Typography>
                      <Chip
                        label={result.prediction === 'Spam' ? '⚠️ Potentially Dangerous' : '✅ Legitimate Email'}
                        color={result.prediction === 'Spam' ? 'error' : 'success'}
                        size="small"
                        sx={{ mt: 0.5, fontWeight: 600 }}
                      />
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Confidence: {result.confidence_percentage.toFixed(2)}%
                    </Typography>
                    <IconButton size="small" onClick={copyToClipboard} title="Copy results">
                      <CopyIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={result.confidence_percentage}
                    sx={{
                      height: 12,
                      borderRadius: 6,
                      bgcolor: 'rgba(0,0,0,0.1)',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: result.prediction === 'Spam' ? 'error.main' : 'success.main',
                        borderRadius: 6,
                      }
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Raw Score: {result.raw_score?.toFixed(4) || 'N/A'} | Label: {result.label}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Example Emails */}
        <Collapse in={showExamples}>
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
              📝 Try these examples:
            </Typography>
            <Grid container spacing={1}>
              {exampleEmails.map((example, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    sx={{ 
                      justifyContent: 'flex-start', 
                      textTransform: 'none',
                      py: 1,
                      textAlign: 'left'
                    }}
                    onClick={() => loadExample(example.text)}
                  >
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                        {example.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {example.text.substring(0, 50)}...
                      </Typography>
                    </Box>
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Collapse>
      </Paper>
    </Box>
  );
}

export default EmailClassifier;