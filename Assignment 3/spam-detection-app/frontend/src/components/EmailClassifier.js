import React, { useState } from 'react';
import {
  Paper, TextField, Button, Box, Typography, Alert, CircularProgress,
  Card, CardContent, Chip, Grid, LinearProgress
} from '@mui/material';
import {
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import axios from 'axios';

function EmailClassifier({ onPrediction }) {
  const [emailText, setEmailText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!emailText.trim()) {
      setError('Please enter email text');
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

    } catch (err) {
      console.error('Prediction error:', err);
      setError(err.response?.data?.detail || 'Failed to classify email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setEmailText('');
    setResult(null);
    setError('');
  };

  const exampleEmails = [
    "Dear customer, your account has been compromised. Click here immediately to verify your credentials.",
    "Hi team, just a reminder that our meeting is scheduled for tomorrow at 2 PM in the conference room.",
    "CONGRATULATIONS!!! You've WON $1,000,000! Claim your prize NOW by clicking this link!"
  ];

  const loadExample = (example) => {
    setEmailText(example);
    setResult(null);
    setError('');
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Email Classification
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
            sx={{ mb: 2 }}
            disabled={loading}
          />

          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
              disabled={loading || !emailText.trim()}
              fullWidth
            >
              {loading ? 'Classifying...' : 'Classify Email'}
            </Button>
            <Button
              variant="outlined"
              onClick={handleClear}
              disabled={loading}
            >
              Clear
            </Button>
          </Box>
        </form>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {result && (
          <Card sx={{ mt: 3, bgcolor: result.prediction === 'Spam' ? '#ffebee' : '#e8f5e9' }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {result.prediction === 'Spam' ? (
                      <WarningIcon color="error" sx={{ fontSize: 40 }} />
                    ) : (
                      <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />
                    )}
                    <Box>
                      <Typography variant="h4">
                        {result.prediction}
                      </Typography>
                      <Chip
                        label={result.prediction === 'Spam' ? 'Potentially Dangerous' : 'Legitimate Email'}
                        color={result.prediction === 'Spam' ? 'error' : 'success'}
                        size="small"
                      />
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" gutterBottom>
                    Confidence: {result.confidence_percentage.toFixed(2)}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={result.confidence_percentage}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      bgcolor: 'grey.300',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: result.prediction === 'Spam' ? 'error.main' : 'success.main'
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Try these examples:
          </Typography>
          <Grid container spacing={1}>
            {exampleEmails.map((example, index) => (
              <Grid item xs={12} key={index}>
                <Button
                  variant="outlined"
                  size="small"
                  fullWidth
                  sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                  onClick={() => loadExample(example)}
                >
                  {example.substring(0, 60)}...
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