import React, { useState } from 'react';
import {
  AppBar, Toolbar, Typography, Container, Box, ThemeProvider, createTheme, CssBaseline
} from '@mui/material';
import EmailClassifier from './components/EmailClassifier';
import Charts from './components/Charts';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    success: {
      main: '#4caf50',
    },
    warning: {
      main: '#ff9800',
    },
  },
});

function App() {
  const [predictionHistory, setPredictionHistory] = useState([]);

  const addPrediction = (prediction) => {
    setPredictionHistory(prev => [...prev, prediction]);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Email Spam Detection System
            </Typography>
            <Typography variant="body2">
              Coast Guard - Group 1
            </Typography>
          </Toolbar>
        </AppBar>

        <Container component="main" sx={{ mt: 4, mb: 4, flex: 1 }}>
          <Typography variant="h3" component="h1" gutterBottom align="center">
            Spam or Ham?
          </Typography>
          <Typography variant="h6" component="h2" gutterBottom align="center" color="text.secondary">
            Classify your emails with our AI-powered spam detection system
          </Typography>

          <EmailClassifier onPrediction={addPrediction} />
          
          {predictionHistory.length > 0 && (
            <Charts predictions={predictionHistory} />
          )}
        </Container>

        <Box component="footer" sx={{ bgcolor: 'background.paper', py: 3, mt: 'auto' }}>
          <Container maxWidth="lg">
            <Typography variant="body1" align="center">
              COS30049 - Computing Technology Innovation Project
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Linear SVM Model - 90.50% Accuracy
            </Typography>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;