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
 * - Drag & Drop .txt file upload
 * - Tutorial modal guide
 * 
 * @component
 * @param {Function} onPrediction - Callback function when prediction completes
 * 
 * @author Coast Guard - Group 1
 */

import React, { useState, useRef } from 'react';
import {
  Paper, TextField, Button, Box, Typography, Alert, CircularProgress,
  Card, CardContent, Chip, Grid, LinearProgress, IconButton, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, Tooltip
} from '@mui/material';
import {
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Clear as ClearIcon,
  ContentCopy as CopyIcon,
  CloudUpload as CloudUploadIcon,
  Description as DescriptionIcon,
  Help as HelpIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import axios from 'axios';

function EmailClassifier({ onPrediction }) {
  // State: Email text input
  const [emailText, setEmailText] = useState('');
  
  // State: Loading indicator during API call
  const [loading, setLoading] = useState(false);
  
  // State: Prediction result from backend
  const [result, setResult] = useState(null);
  
  // State: Error messages for user feedback
  const [error, setError] = useState('');

  // : Drag & Drop states
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const fileInputRef = useRef(null);

  // : Tutorial modal state
  const [tutorialOpen, setTutorialOpen] = useState(false);

  // Calculate text statistics for user feedback
  const characterCount = emailText.length;
  const wordCount = emailText.trim().split(/\s+/).filter(Boolean).length;
  const isValidLength = emailText.trim().length >= 10;

  /**
   * Handles form submission and email classification
   * 
   * Process:
   * 1. Validates input (not empty, minimum 10 characters)
   * 2. Sends POST request to backend API
   * 3. Displays result or error message
   * 4. Calls parent callback with prediction data
   * 
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Input validation
    if (!emailText.trim()) {
      setError('Please enter email text');
      return;
    }

    if (!isValidLength) {
      setError('Email text must be at least 10 characters long');
      return;
    }

    // Start loading state
    setLoading(true);
    setError('');
    setResult(null);

    try {
      // Send classification request to backend
      const response = await axios.post('http://localhost:8000/predict', {
        text: emailText
      });

      // Create prediction object with timestamp
      const prediction = {
        ...response.data,
        timestamp: new Date().toISOString(),
        text: emailText
      };

      // Update state and notify parent
      setResult(prediction);
      onPrediction(prediction);

    } catch (err) {
      // Handle different types of errors
      console.error('Classification error:', err);
      
      if (err.response) {
        // Backend returned error response
        setError(err.response?.data?.detail || 'Classification failed. Please try again.');
      } else if (err.request) {
        // Network error - backend not reachable
        setError('Cannot connect to server. Please ensure the backend is running on http://localhost:8000');
      } else {
        // Other errors
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      // Always stop loading, even if error occurred
      setLoading(false);
    }
  };

  /**
   * : Handle drag events for file upload
   */
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  /**
   * Handle file drop
   */
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  };

  /**
   * Handle file input change (click to select)
   */
  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  /**
   *  Process uploaded .txt file
   */
  const handleFileUpload = (file) => {
    // Check if file is .txt
    if (!file.name.endsWith('.txt')) {
      setError('Please upload a .txt file only');
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
      const text = e.target.result;
      setEmailText(text);
      setUploadedFileName(file.name);
      setError('');
      setResult(null);
    };

    reader.onerror = () => {
      setError('Failed to read file');
    };

    reader.readAsText(file);
  };

  /**
   * Clears input field and resets component state
   * Allows user to start fresh classification
   */
  const handleClear = () => {
    setEmailText('');
    setResult(null);
    setError('');
    setUploadedFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Pre-defined example emails for quick testing
   * Includes 2 spam examples and 2 ham (legitimate) examples
   * Helps users understand what types of emails the model can classify
   */
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

  /**
   * Loads example email text into input field
   * Clears any previous results or errors
   * 
   * @param {String} example - Email text to load
   */
  const loadExample = (example) => {
    setEmailText(example);
    setResult(null);
    setError('');
    setUploadedFileName('');
  };

  /**
   * Copies prediction results to clipboard
   * Format: Prediction, Confidence, Email text
   */
  const copyToClipboard = () => {
    if (result) {
      const text = `Prediction: ${result.prediction}\nConfidence: ${result.confidence_percentage.toFixed(2)}%\nEmail: ${result.text}`;
      navigator.clipboard.writeText(text);
    }
  };

  return (
    <Box sx={{ mb: 6 }}>
      {/*  Tutorial Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Tooltip title="How to use this system">
          <Button
            variant="outlined"
            startIcon={<HelpIcon />}
            onClick={() => setTutorialOpen(true)}
          >
            Tutorial
          </Button>
        </Tooltip>
      </Box>

      <Paper elevation={0} sx={{ p: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
        
        {/* Section Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Box sx={{ width: 4, height: 24, bgcolor: 'primary.main', mr: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Email Classification
          </Typography>
        </Box>

        {/*  Drag and Drop Zone */}
        <Box
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          sx={{
            mb: 3,
            p: 4,
            border: '2px dashed',
            borderColor: dragActive ? 'primary.main' : 'grey.300',
            backgroundColor: dragActive ? 'action.hover' : 'background.paper',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            textAlign: 'center',
            '&:hover': {
              borderColor: 'primary.main',
              backgroundColor: 'action.hover'
            }
          }}
        >
          <CloudUploadIcon 
            sx={{ 
              fontSize: 48, 
              color: dragActive ? 'primary.main' : 'grey.400',
              mb: 1
            }} 
          />
          <Typography variant="body1" color="text.secondary">
            Drag & drop an email (.txt) file here, or click to select
          </Typography>
          {uploadedFileName && (
            <Chip
              icon={<DescriptionIcon />}
              label={uploadedFileName}
              color="primary"
              sx={{ mt: 2 }}
              onDelete={handleClear}
            />
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt"
            style={{ display: 'none' }}
            onChange={handleFileInputChange}
          />
        </Box>
        
        <form onSubmit={handleSubmit}>
          {/* Text Input Field */}
          <TextField
            fullWidth
            multiline
            rows={6}
            variant="outlined"
            label="Enter Email Content"
            placeholder="Paste or type email content here for analysis..."
            value={emailText}
            onChange={(e) => setEmailText(e.target.value)}
            sx={{ mb: 1 }}
            disabled={loading}
            error={error && !emailText.trim()}
          />

          {/* Character and Word Counter */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, px: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
              {characterCount} characters • {wordCount} words
            </Typography>
            {emailText.trim().length > 0 && !isValidLength && (
              <Typography variant="caption" color="error" sx={{ fontWeight: 600 }}>
                Minimum 10 characters required
              </Typography>
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

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
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
            <CardContent sx={{ p: 3 }}>
              <Grid container spacing={3} alignItems="center">
                
                {/* Prediction Label */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {result.prediction === 'Spam' ? (
                      <WarningIcon color="error" sx={{ fontSize: 48 }} />
                    ) : (
                      <CheckCircleIcon color="success" sx={{ fontSize: 48 }} />
                    )}
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                        {result.prediction.toUpperCase()}
                      </Typography>
                      <Chip
                        label={result.prediction === 'Spam' ? 'POTENTIALLY DANGEROUS' : 'LEGITIMATE EMAIL'}
                        color={result.prediction === 'Spam' ? 'error' : 'success'}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>
                  </Box>
                </Grid>
                
                {/* Confidence Score */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                      Confidence: {result.confidence_percentage.toFixed(2)}%
                    </Typography>
                    <IconButton size="small" onClick={copyToClipboard} title="Copy Results">
                      <CopyIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  
                  {/* Confidence Progress Bar */}
                  <LinearProgress
                    variant="determinate"
                    value={result.confidence_percentage}
                    sx={{
                      height: 12,
                      bgcolor: 'rgba(0,0,0,0.1)',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: result.prediction === 'Spam' ? 'error.main' : 'success.main',
                      }
                    }}
                  />
                  
                  {/* Additional Metrics */}
                  <Box sx={{ mt: 1, display: 'flex', gap: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Raw Score: {result.raw_score?.toFixed(4) || 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Label: {result.label}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

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

      {/* Tutorial Modal */}
      <Dialog
        open={tutorialOpen}
        onClose={() => setTutorialOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ 
          bgcolor: 'primary.main', 
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="h5" component="span" sx={{ color: 'white' }}>
            How to Use Spam Detection Analytics
          </Typography>
          <IconButton
            onClick={() => setTutorialOpen(false)}
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
            Welcome to the Spam Detection Analytics Dashboard!
          </Typography>
          
          <Typography variant="body1" paragraph>
            This dashboard provides comprehensive visualizations and analytics for your spam detection model 
            powered by Linear SVM with 90.50% accuracy.
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3, fontWeight: 'bold' }}>
            Features:
          </Typography>

          <Box component="ul" sx={{ pl: 2 }}>
            <Typography component="li" variant="body1" paragraph>
              <strong>Drag & Drop:</strong> Simply drag and drop .txt email files to get instant predictions. 
              The system will automatically classify them as Spam or Ham.
            </Typography>

            <Typography component="li" variant="body1" paragraph>
              <strong>Manual Input:</strong> Type or paste email content directly into the text area for classification.
            </Typography>

            <Typography component="li" variant="body1" paragraph>
              <strong>Chart Visualization:</strong> All predictions are visualized in interactive charts below. 
              Use your <strong>mouse wheel to zoom in/out</strong> (50%-200%) and drag to pan across charts.
            </Typography>

            <Typography component="li" variant="body1" paragraph>
              <strong>Chart Filters:</strong> Switch between different chart views - Distribution, Performance, 
              or view all charts at once using the filter buttons.
            </Typography>

            <Typography component="li" variant="body1" paragraph>
              <strong>Metrics Panel:</strong> Click the "Metrics Panel" button to view key statistics including 
              total predictions, spam/ham counts, average confidence, and model accuracy.
            </Typography>

            <Typography component="li" variant="body1" paragraph>
              <strong>Export Data:</strong> Download your prediction history and charts as CSV files or images 
              for reporting and analysis.
            </Typography>

            <Typography component="li" variant="body1" paragraph>
              <strong>Prediction History:</strong> All classifications are automatically saved and can be 
              reviewed in the history table with detailed view options.
            </Typography>
            <Typography component="li" variant="body1" paragraph>
              <strong>Charts Download:</strong> All charts can be downloaded indiviually in .png form 
            </Typography>
          </Box>

          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>Note:</strong> This system uses a Linear SVM model trained on 89,174 emails 
              achieving 90.50% accuracy. The model analyzes text patterns using TF-IDF vectorization 
              with 100 key features to detect spam indicators.
            </Typography>
          </Alert>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setTutorialOpen(false)} 
            variant="contained" 
            size="large"
            fullWidth
          >
            Got it!
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default EmailClassifier;
