/**
 * App.js - Main Application Component
 * 
 * Manages the entire spam detection application including:
 * - Prediction history state management with JSON persistence
 * - File save/load functionality for long-term data tracking
 * - Professional flat UI theme with sharp design
 * - Responsive layout for all devices
 * 
 * @component
 * @author Coast Guard - Group 1
 * @course COS30049 - Computing Technology Innovation Project
 */

import React, { useState, useEffect } from 'react';
import {
  AppBar, Toolbar, Typography, Container, Box, ThemeProvider, createTheme, 
  CssBaseline, IconButton, Tooltip, Button, Dialog, DialogTitle, 
  DialogContent, DialogContentText, DialogActions, Divider, Tabs, Tab
} from '@mui/material';
import { 
  DeleteForever as DeleteIcon,
} from '@mui/icons-material';
import EmailClassifier from './components/EmailClassifier';
import Charts from './components/Charts';
import Statistics from './components/Statistics';
import PredictionHistory from './components/PredictionHistory';
import axios from 'axios';

/**
 * Professional Enterprise Theme Configuration
 * 
 * Design principles:
 * - Flat design (no rounded corners)
 * - Sharp, clean lines
 * - Professional color palette
 * - High contrast for readability
 * - Consistent spacing
 */
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1a365d', // Deep professional blue
      light: '#2563eb',
      dark: '#0f172a',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#dc2626', // Professional red
      light: '#ef4444',
      dark: '#991b1b',
    },
    success: {
      main: '#059669', // Professional green
      light: '#10b981',
      dark: '#047857',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#475569',
    },
    divider: '#e2e8f0',
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
    h3: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
      color: '#0f172a',
    },
    h5: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
      color: '#1e293b',
    },
    h6: {
      fontWeight: 600,
      letterSpacing: '0',
    },
    body1: {
      letterSpacing: '0',
    },
    button: {
      fontWeight: 600,
      letterSpacing: '0.02em',
    },
  },
  shape: {
    borderRadius: 0, // Flat design - no rounded corners
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 0, // Sharp corners
          fontWeight: 600,
          padding: '10px 24px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 0, // Flat design
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
          border: '1px solid #e2e8f0',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 0, // Flat design
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 0, // Flat design
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 0, // Flat design
        },
      },
    },
  },
});

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function App() {
  // State: Stores all prediction history
  const [predictionHistory, setPredictionHistory] = useState([]);

  // State: Manages current tab (0: Classifier, 1: Charts, 2: Stats, 3: History)
  const [tabValue, setTabValue] = useState(0);

  // State: Stores statistics data
  const [statistics, setStatistics] = useState(null);
  
  // State: Controls confirmation dialog for clearing history
  const [openClearDialog, setOpenClearDialog] = useState(false);
  
  // Load predictions on app startup
  useEffect(() => {
    loadPredictionHistory();
    loadStatistics();
  }, []);

  const loadPredictionHistory = async () => {
    try {
      const response = await axios.get('http://localhost:8000/predictions');
      setPredictionHistory(response.data.predictions || []);
    } catch (err) {
      console.error('Failed to load prediction history:', err);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await axios.get('http://localhost:8000/statistics');
      setStatistics(response.data);
    } catch (err) {
      console.error('Failed to load statistics:', err);
    }
  };

  /**
   * Adds a new prediction to history
   * Data accumulates in memory - user manually saves when ready
   * This allows for session-based analysis before persisting
   * 
   * @param {Object} prediction - Prediction object from backend containing:
   *   - prediction: "Spam" or "Ham" (string)
   *   - label: 0 or 1 (integer)
   *   - confidence: decimal 0-1 (float)
   *   - confidence_percentage: 0-100 (float)
   *   - raw_score: decision function value (float)
   *   - timestamp: ISO date string
   *   - text: original email content (string)
   */
  const addPrediction = (prediction) => {
    setPredictionHistory(prev => [...prev, prediction]);
    loadStatistics(); // Refresh statistics
  };

  const handleClearHistory = async () => {
    if (window.confirm('Are you sure? This action cannot be undone!')) {
      try {
        await axios.delete('http://localhost:8000/predictions');
        setPredictionHistory([]);
        setStatistics(null);
        alert('All predictions cleared successfully');
        setOpenClearDialog(false);
      } catch (err) {
        alert('Failed to clear predictions: ' + err.message);
      }
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
        
        {/* Professional Header Bar */}
        <AppBar position="static" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
          <Toolbar sx={{ py: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
              <Box sx={{ 
                width: 8, 
                height: 32, 
                bgcolor: 'primary.light', 
                mr: 2 
              }} />
              <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '0.02em' }}>
                CoastGuard - Spam Email Detection
              </Typography>
            </Box>
            
            <Tabs value={tabValue}
              onChange={handleTabChange}
              variant="fullWidth"
              textColor="inherit"
              sx={{
                flexGrow: 1,
                '& .MuiTab-root': {
                  color: 'white',
                  textTransform: 'none',
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                  fontSize: '0.95rem',
                  minHeight: '64px',
                },
                '& .Mui-selected': {
                  color: theme.palette.ContrastText,
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: theme.palette.primary.light,
                  height: '4px',
                  borderRadius: '4px 4px 0 0',
                },
              }}
            >
              <Tab label="Classify Email" />
              <Tab label="Analytics & Charts" />
              <Tab label="Statistics" />
              <Tab label="Prediction History" />
            </Tabs>
                      
            {/* Action buttons - only show when predictions exist */}
            {predictionHistory.length > 0 && (
              <>                
                <Tooltip title="Clear All History">
                  <IconButton 
                    color="inherit" 
                    onClick={() => setOpenClearDialog(true)}
                    sx={{ ml: 1 }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
                
                <Box sx={{ 
                  ml: 2, 
                  px: 2, 
                  py: 0.5, 
                  bgcolor: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.3)'
                }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {predictionHistory.length} PREDICTIONS
                  </Typography>
                </Box>
              </>
            )}
         
            <Divider orientation="vertical" flexItem sx={{ mx: 2, bgcolor: 'rgba(255,255,255,0.3)' }} />
            
            <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
              COAST GUARD - GROUP 1
            </Typography>
          </Toolbar>
        </AppBar>

        {/* Main Content Area */}
        <Container component="main" sx={{ mt: 6, mb: 6, flex: 1 }} maxWidth="xl">
          
          {/* Title Section */}
          <Box sx={{ mb: 6 }}>
            <Typography variant="h3" component="h1" gutterBottom sx={{ mb: 2 }}>
              CoastGuard Spam Detection System
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 3, fontWeight: 400 }}>
              Enterprise-grade AI-powered email classification using Linear Support Vector Machine
            </Typography>
            <Box sx={{ 
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              p: 2, 
              bgcolor: 'primary.main', 
              color: 'white',
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
              borderBottomLeftRadius: 8,
              borderBottomRightRadius: 8
            }}>
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mb: 0.5 }}>
                  MODEL ACCURACY
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  90.50%
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} />
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mb: 0.5 }}>
                  ALGORITHM
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  LINEAR SVM
                </Typography>
              </Box>
            </Box>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <EmailClassifier onPrediction={addPrediction} />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {predictionHistory.length > 0 ? (
              <Charts predictions={predictionHistory} />
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  No predictions yet. Classify some emails to see charts and analytics.
                </Typography>
              </Box>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            {statistics ? (
              <Statistics statistics={statistics} />
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  No statistics available yet.
                </Typography>
              </Box>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <PredictionHistory 
              predictions={predictionHistory} 
              onClear={handleClearHistory}
            />
          </TabPanel>

        </Container>

        {/* Professional Footer */}
        <Box 
          component="footer" 
          sx={{ 
            bgcolor: 'primary.main', 
            color: 'white',
            py: 4, 
            mt: 'auto'
          }}
        >
          <Container maxWidth="xl">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                  COS30049 - Computing Technology Innovation Project
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Linear SVM Model | 90.50% Accuracy | Swinburne University of Technology
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Damian Moisidis | Mufid Kadli | Pratham Kumar
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  ©2025 Session 24 - Group 1
                </Typography>
              </Box>
            </Box>
          </Container>
        </Box>
      </Box>

      {/* Confirmation Dialog for Clearing History */}
      <Dialog
        open={openClearDialog}
        onClose={() => setOpenClearDialog(false)}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Clear All History?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to clear all {predictionHistory.length} predictions from memory?
            <br /><br />
            <strong>Note:</strong> This will DELETE any and ALL data from the local JSON file. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenClearDialog(false)} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleClearHistory} color="error" variant="contained">
            Clear All
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}

export default App;
