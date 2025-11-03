import React, { useState } from 'react';
import {
  AppBar, Toolbar, Typography, Container, Box, ThemeProvider, createTheme, 
  CssBaseline, IconButton, Tooltip
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import EmailClassifier from './components/EmailClassifier';
import Charts from './components/Charts';

// Professional Government/Cybersecurity Theme - Dark Blue
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1e3a8a', // Dark blue
      light: '#3b82f6',
      dark: '#1e40af',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#dc2626', // Red for spam
      light: '#ef4444',
      dark: '#b91c1c',
    },
    success: {
      main: '#16a34a', // Green for ham
      light: '#22c55e',
      dark: '#15803d',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h3: {
      fontWeight: 700,
      color: '#1e3a8a',
    },
    h5: {
      fontWeight: 600,
      color: '#1e3a8a',
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

function App() {
  const [predictionHistory, setPredictionHistory] = useState([]);

  const addPrediction = (prediction) => {
    setPredictionHistory(prev => [...prev, prediction]);
  };

  const exportAllPredictions = () => {
    if (predictionHistory.length === 0) {
      alert('No predictions to export yet!');
      return;
    }

    // Create CSV content
    const headers = ['Timestamp', 'Prediction', 'Confidence %', 'Email Text'];
    const csvContent = [
      headers.join(','),
      ...predictionHistory.map(p => [
        new Date(p.timestamp).toLocaleString(),
        p.prediction,
        p.confidence_percentage.toFixed(2),
        `"${p.text.replace(/"/g, '""').substring(0, 100)}..."` // Escape quotes and truncate
      ].join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `spam_predictions_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
        {/* Header */}
        <AppBar position="static" elevation={2}>
          <Toolbar>
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
                🛡️ Email Spam Detection System
              </Typography>
            </Box>
            {predictionHistory.length > 0 && (
              <Tooltip title="Export All Predictions">
                <IconButton 
                  color="inherit" 
                  onClick={exportAllPredictions}
                  sx={{ ml: 2 }}
                >
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
            )}
            <Typography variant="body2" sx={{ ml: 2, opacity: 0.9 }}>
              Coast Guard - Group 1
            </Typography>
          </Toolbar>
        </AppBar>

        {/* Main Content */}
        <Container component="main" sx={{ mt: 4, mb: 4, flex: 1 }} maxWidth="lg">
          {/* Title Section */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h3" component="h1" gutterBottom>
              Spam or Ham?
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto' }}>
              Classify your emails with our AI-powered spam detection system using Linear SVM
            </Typography>
            <Box sx={{ 
              mt: 2, 
              p: 1.5, 
              bgcolor: 'primary.main', 
              color: 'white', 
              borderRadius: 2,
              display: 'inline-block'
            }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Model Accuracy: 90.50% | Powered by Linear SVM
              </Typography>
            </Box>
          </Box>

          {/* Email Classifier Component */}
          <EmailClassifier onPrediction={addPrediction} />
          
          {/* Charts Component */}
          {predictionHistory.length > 0 && (
            <Charts predictions={predictionHistory} />
          )}

          {/* Empty State */}
          {predictionHistory.length === 0 && (
            <Box sx={{ 
              mt: 6, 
              p: 4, 
              textAlign: 'center', 
              bgcolor: 'background.paper',
              borderRadius: 3,
              border: '2px dashed',
              borderColor: 'primary.light',
            }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                📊 No Predictions Yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Enter an email above to see interactive charts and analytics
              </Typography>
            </Box>
          )}
        </Container>

        {/* Footer */}
        <Box 
          component="footer" 
          sx={{ 
            bgcolor: 'primary.main', 
            color: 'white',
            py: 3, 
            mt: 'auto',
            borderTop: '4px solid',
            borderColor: 'primary.dark'
          }}
        >
          <Container maxWidth="lg">
            <Typography variant="body1" align="center" sx={{ fontWeight: 600 }}>
              COS30049 - Computing Technology Innovation Project
            </Typography>
            <Typography variant="body2" align="center" sx={{ mt: 1, opacity: 0.9 }}>
              Linear SVM Model | 90.50% Accuracy | Swinburne University of Technology
            </Typography>
            <Typography variant="caption" align="center" display="block" sx={{ mt: 1, opacity: 0.8 }}>
              Damian Moisidis | Mufid Kadli | Pratham Kumar
            </Typography>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;