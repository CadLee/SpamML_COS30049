/**
 * App.js - Main Application Component
 * 
 * Manages the entire spam detection application including:
 * - Prediction history state management with JSON persistence
 * - File save/load functionality for long-term data tracking
 * - CSV export for data analysis
 * - Professional flat UI theme with sharp design
 * - Responsive layout for all devices
 * 
 * @component
 * @author Coast Guard - Group 1
 * @course COS30049 - Computing Technology Innovation Project
 */

import React, { useState, useRef } from 'react';
import {
  AppBar, Toolbar, Typography, Container, Box, ThemeProvider, createTheme, 
  CssBaseline, IconButton, Tooltip, Button, Dialog, DialogTitle, 
  DialogContent, DialogContentText, DialogActions, Divider
} from '@mui/material';
import { 
  Download as DownloadIcon,
  DeleteForever as DeleteIcon,
  Upload as UploadIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import EmailClassifier from './components/EmailClassifier';
import Charts from './components/Charts';

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

function App() {
  // State: Stores all prediction history
  const [predictionHistory, setPredictionHistory] = useState([]);
  
  // State: Controls confirmation dialog for clearing history
  const [openClearDialog, setOpenClearDialog] = useState(false);
  
  // Ref: Hidden file input for loading JSON files
  const fileInputRef = useRef(null);

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
  };

  /**
   * Saves all prediction history to downloadable JSON file
   * Creates formatted JSON with proper indentation for readability
   * Filename includes current date for version tracking
   * 
   * Use case: Daily/weekly data archiving for long-term analysis
   * 
   * @param {Array} data - Array of prediction objects (defaults to current state)
   */
  const saveToJSON = (data = predictionHistory) => {
    if (data.length === 0) {
      alert('No predictions to save!');
      return;
    }

    try {
      // Create JSON string with 2-space indentation for readability
      const jsonString = JSON.stringify(data, null, 2);
      
      // Create blob from JSON string
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      // Create download link with date-stamped filename
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `spam_predictions_${new Date().toISOString().slice(0,10)}.json`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up object URL to free memory
      URL.revokeObjectURL(url);
      
      console.log(`✓ Saved ${data.length} predictions to JSON file`);
    } catch (error) {
      console.error('Error saving to JSON:', error);
      alert('Failed to save JSON file. Please try again.');
    }
  };

  /**
   * Loads predictions from JSON file and adds to existing data
   * Accumulates data over time instead of replacing current predictions
   * This allows continuous data collection across multiple sessions
   * 
   * Use case: Loading previous week's data to continue analysis
   * 
   * @param {Event} event - File input change event
   */
  const loadFromJSON = (event) => {
    const file = event.target.files[0];
    
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.json')) {
      alert('Please select a valid JSON file');
      return;
    }

    const reader = new FileReader();
    
    // Handle successful file read
    reader.onload = (e) => {
      try {
        // Parse JSON content
        const data = JSON.parse(e.target.result);
        
        // Validate data structure
        if (!Array.isArray(data)) {
          throw new Error('Invalid format: Expected array of predictions');
        }
        
        // Validate each prediction object has required fields
        const isValid = data.every(item => 
          item.hasOwnProperty('prediction') && 
          item.hasOwnProperty('confidence_percentage')
        );
        
        if (!isValid) {
          throw new Error('Invalid data structure in JSON file');
        }
        
        // Add loaded data to existing predictions (accumulate, don't replace)
        setPredictionHistory(prev => {
          const combined = [...prev, ...data];
          console.log(`✓ Added ${data.length} predictions. Total: ${combined.length}`);
          alert(`Successfully added ${data.length} predictions!\nTotal predictions: ${combined.length}`);
          return combined;
        });
        
      } catch (error) {
        console.error('Error loading JSON:', error);
        alert(`Failed to load JSON file.\n\nError: ${error.message}\n\nPlease check the file format.`);
      }
    };
    
    // Handle file read errors
    reader.onerror = () => {
      alert('Failed to read file. Please try again.');
    };
    
    // Read file as text
    reader.readAsText(file);
    
    // Reset input to allow loading same file again
    event.target.value = '';
  };

  /**
   * Clears all prediction history from state
   * Does not delete saved JSON files (those remain as backups)
   * 
   * Use case: Starting fresh analysis session
   */
  const handleClearHistory = () => {
    setPredictionHistory([]);
    setOpenClearDialog(false);
    console.log('✓ Cleared all prediction history from memory');
  };

  /**
   * Exports all predictions to CSV file for spreadsheet analysis
   * Format: Timestamp, Prediction, Confidence %, Email Text (truncated)
   * 
   * Use case: Importing data into Excel/Google Sheets for analysis
   */
  const exportCSV = () => {
    if (predictionHistory.length === 0) {
      alert('No predictions to export!');
      return;
    }

    try {
      // Create CSV headers
      const headers = ['Timestamp', 'Prediction', 'Confidence %', 'Raw Score', 'Label', 'Email Text'];
      
      // Create CSV rows from prediction history
      const csvContent = [
        headers.join(','),
        ...predictionHistory.map(p => [
          new Date(p.timestamp).toLocaleString(),
          p.prediction,
          p.confidence_percentage.toFixed(2),
          p.raw_score?.toFixed(4) || 'N/A',
          p.label,
          `"${(p.text || '').replace(/"/g, '""').substring(0, 100)}..."` // Escape quotes and truncate
        ].join(','))
      ].join('\n');

      // Create blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.href = url;
      link.download = `spam_predictions_${new Date().toISOString().slice(0,10)}.csv`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      console.log(`✓ Exported ${predictionHistory.length} predictions to CSV`);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export CSV file. Please try again.');
    }
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
                EMAIL SPAM DETECTION SYSTEM
              </Typography>
            </Box>
            
            {/* Action buttons - only show when predictions exist */}
            {predictionHistory.length > 0 && (
              <>
                <Tooltip title="Save Predictions to JSON File">
                  <IconButton 
                    color="inherit" 
                    onClick={() => saveToJSON()}
                    sx={{ ml: 1 }}
                  >
                    <SaveIcon />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Export to CSV">
                  <IconButton 
                    color="inherit" 
                    onClick={exportCSV}
                    sx={{ ml: 1 }}
                  >
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
                
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
            
            {/* Load JSON button - always visible */}
            <Tooltip title="Load Predictions from JSON File">
              <IconButton 
                color="inherit" 
                onClick={() => fileInputRef.current?.click()}
                sx={{ ml: 2 }}
              >
                <UploadIcon />
              </IconButton>
            </Tooltip>
            
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={loadFromJSON}
              style={{ display: 'none' }}
            />
            
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
              Spam or Ham Classification
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

          {/* Email Classifier Component */}
          <EmailClassifier onPrediction={addPrediction} />
          
          {/* Charts Component - Only show if predictions exist */}
          {predictionHistory.length > 0 && (
            <Charts predictions={predictionHistory} />
          )}

          {/* Empty State - Show when no predictions */}
          {predictionHistory.length === 0 && (
            <Box sx={{ 
              mt: 8, 
              p: 6, 
              textAlign: 'center', 
              bgcolor: 'background.paper',
              border: '2px dashed',
              borderColor: 'divider',
            }}>
              <Typography variant="h5" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
                No Predictions Yet
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                Enter an email above or load a JSON file to see analytics and visualizations
              </Typography>
            </Box>
          )}
        </Container>

        {/* Professional Footer */}
        <Box 
          component="footer" 
          sx={{ 
            bgcolor: 'primary.main', 
            color: 'white',
            py: 4, 
            mt: 'auto',
            borderTop: '4px solid',
            borderColor: 'primary.dark'
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
                  © 2025 Coast Guard - Group 1
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
            <strong>Note:</strong> This will not delete any saved JSON files. This action cannot be undone.
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
