/**
 * EmailClassifier.js - Email Classification Component
 * 
 * Provides professional UI for email spam classification:
 * - Clean text input with real-time validation
 * - Character and word counters for user feedback
 * - Professional result display with confidence visualization
 * - Quick-load example emails for testing
 * - Comprehensive error handling with user-friendly messages
 * - Smooth animations and loading states
 * 
 * @component
 * @param {Function} onPrediction - Callback function when prediction completes
 * 
 * @author Coast Guard - Group 1
 */

import React, { useState } from 'react';
import {
  Paper, TextField, Button, Box, Typography, Alert, CircularProgress,
  Card, CardContent, Chip, LinearProgress, IconButton, Divider
} from '@mui/material';
import {
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Clear as ClearIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import { Grid2 as Grid } from '@mui/material';
import axios from 'axios';

// State: Email text input
function EmailClassifier({ onPrediction }) {
  const [emailText, setEmailText] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const characterCount = emailText.length;
  const wordCount = emailText.trim().split(/\s+/).filter(Boolean).length;
  const isValidLength = emailText.trim().length >= 10;

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);

    files.forEach(file => {
      if (file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = (event) => {
          classifyEmail(event.target.result);
        };
        reader.readAsText(file);
      } else {
        setError('Only .txt files are allowed');
      }
    });
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  /**
   * Handles form submission and email classification
   * 
   * Process:
   * 1. Validates input (not empty, minimum 10 characters)
   * 2. Sends POST request to backend API
   * 3. Displays result or error message
   * 4. Calls parent callback with prediction data
   * 
   * param {Event} e - Form submit event
   */

  const handleSubmit = async (e) => {
    e.preventDefault();
    await classifyEmail(emailText);
  };

  const classifyEmail = async (text) => {
    if (!text.trim() || text.trim().length < 10) {
      setError('Each email must have at least 10 characters');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await axios.post('http://localhost:8000/predict', { text });
      const prediction = { ...response.data, timestamp: new Date().toISOString(), text };
      setResults(prev => [...prev, prediction]);
      onPrediction(prediction);
    } catch (err) {
      console.error('Classification error:', err);
      setError('Failed to classify one or more emails.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setEmailText('');
    setResults([]);
    setError('');
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
      text: "Hi John, just following up on our meeting last week. Please send me the project files when you get a chance. Thanks!"
    }
  ];

  const loadExample = (example) => {
    setEmailText(example);
    setError('');
  };

  const copyToClipboard = () => {
    if (results.length > 0) {
      const lastResult = results[results.length - 1];
      const text = `Prediction: ${lastResult.prediction}\nConfidence: ${lastResult.confidence_percentage.toFixed(2)}%\nEmail: ${lastResult.text}`;
      navigator.clipboard.writeText(text);
    }
  };

  return (
    <Box sx={{ mb: 6 }}>
      <Paper elevation={0} sx={{ p: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
        {/* Section Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Box sx={{ width: 4, height: 24, bgcolor: 'primary.main', mr: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 600 }}>Email Classification</Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          {/* Drag & Drop Input Area */}
          <Box
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            sx={{
              p: 1,
              mb: 3,
              textAlign: 'center',
              bgcolor: dragActive ? '#f0f8ff' : 'background.paper',
              transition: '0.2s',
              borderRadius: 2,
              border: dragActive ? '2px dashed #1976d2' : 'none'
            }}
          >
            <TextField
              fullWidth
              multiline
              rows={6}
              variant="outlined"
              label="Paste, type, or drop a .txt file here..."
              value={emailText}
              onChange={(e) => setEmailText(e.target.value)}
              disabled={loading}
            />
          </Box>

          {/* Character and Word Counter */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, px: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {characterCount} characters • {wordCount} words
            </Typography>
            {!isValidLength && emailText.trim().length > 0 && (
              <Typography variant="caption" color="error">Minimum 10 characters required</Typography>
            )}
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
              disabled={loading || !emailText.trim() || !isValidLength}
              fullWidth
              size="large"
              sx={{ fontWeight: 600 }}
            >
              {loading ? 'CLASSIFYING...' : 'CLASSIFY EMAIL'}
            </Button>
            <Button
              variant="outlined"
              onClick={handleClear}
              disabled={loading}
              startIcon={<ClearIcon />}
              sx={{ minWidth: 140, fontWeight: 600 }}
            >
              CLEAR
            </Button>
          </Box>
        </form>

        {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

        {results.length > 0 && results.map((res, idx) => (
          <Card key={idx} sx={{
            mt: 3,
            bgcolor: res.prediction === 'Spam' ? '#fef2f2' : '#f0fdf4',
            border: '2px solid',
            borderColor: res.prediction === 'Spam' ? 'secondary.main' : 'success.main'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {res.prediction === 'Spam' ? (
                      <WarningIcon color="error" sx={{ fontSize: 48 }} />
                    ) : (
                      <CheckCircleIcon color="success" sx={{ fontSize: 48 }} />
                    )}
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>{res.prediction.toUpperCase()}</Typography>
                      <Chip
                        label={res.prediction === 'Spam' ? 'POTENTIALLY DANGEROUS' : 'LEGITIMATE EMAIL'}
                        color={res.prediction === 'Spam' ? 'error' : 'success'}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                      Confidence: {res.confidence_percentage.toFixed(2)}%
                    </Typography>
                    <IconButton size="small" onClick={copyToClipboard} title="Copy Results">
                      <CopyIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={res.confidence_percentage}
                    sx={{
                      height: 12,
                      bgcolor: 'rgba(0,0,0,0.1)',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: res.prediction === 'Spam' ? 'error.main' : 'success.main',
                      }
                    }}
                  />
                  <Box sx={{ mt: 1, display: 'flex', gap: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Raw Score: {res.raw_score?.toFixed(4) || 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Label: {res.label}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        ))}

        <Divider sx={{ my: 4 }} />

        {/* Example Emails Section */}
        <Box>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Quick Test Examples
          </Typography>
          <Grid container spacing={2}>
            {exampleEmails.map((example, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <Button
                  variant="outlined"
                  size="small"
                  fullWidth
                  sx={{
                    justifyContent: 'flex-start',
                    textTransform: 'none',
                    py: 1.5,
                    px: 2,
                    textAlign: 'left',
                    height: 'auto',
                    fontWeight: 500,
                  }}
                  onClick={() => loadExample(example.text)}
                >
                  <Box sx={{ width: '100%' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5, color: 'primary.main' }}>
                      {example.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>
                      {example.text.substring(0, 60)}...
                    </Typography>
                  </Box>
                </Button>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
}

export default EmailClassifier;
