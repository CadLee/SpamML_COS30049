import React, { useState } from 'react';
import {
  Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Box, Button, Chip, Stack, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, Pagination
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import axios from 'axios';

function PredictionHistory({ predictions, onClear }) {
  const [page, setPage] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPrediction, setSelectedPrediction] = useState(null);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(predictions.length / itemsPerPage);
  const startIdx = (page - 1) * itemsPerPage;
  const displayedPredictions = [...predictions].reverse().slice(startIdx, startIdx + itemsPerPage);

  const handleViewDetails = (prediction) => {
    setSelectedPrediction(prediction);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedPrediction(null);
  };

  const handleExportCSV = async () => {
    try {
      const response = await axios.get('http://localhost:8000/export/csv', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'predictions.csv');
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
      alert('✓ CSV file downloaded successfully');
    } catch (err) {
      alert('Failed to export CSV: ' + err.message);
    }
  };

  const handleExportJSON = async () => {
    try {
      const response = await axios.get('http://localhost:8000/export/json', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'predictions.json');
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
      alert('✓ JSON file downloaded successfully');
    } catch (err) {
      alert('Failed to export JSON: ' + err.message);
    }
  };

  if (predictions.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No prediction history yet. Classify some emails to see them here.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Prediction History ({predictions.length} total)
      </Typography>

      {/* Action Buttons */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleExportCSV}
        >
          Export as CSV
        </Button>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleExportJSON}
        >
          Export as JSON
        </Button>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={onClear}
        >
          Clear History
        </Button>
      </Stack>

      {/* Predictions Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: 'background.default' }}>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Timestamp</TableCell>
              <TableCell>Prediction</TableCell>
              <TableCell align="right">Confidence</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayedPredictions.map((pred, index) => (
              <TableRow key={index} hover>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                  {pred.id || `#${predictions.length - startIdx - index}`}
                </TableCell>
                <TableCell sx={{ fontSize: '0.85rem' }}>
                  {pred.timestamp ? new Date(pred.timestamp).toLocaleString() : 'Unknown'}
                </TableCell>
                <TableCell>
                  <Chip
                    label={pred.prediction}
                    color={pred.prediction === 'Spam' ? 'error' : 'success'}
                    size="small"
                    variant="filled"
                  />
                </TableCell>
                <TableCell align="right" sx={{ fontSize: '0.9rem' }}>
                  {pred.confidence_percentage ? pred.confidence_percentage.toFixed(2) + '%' : 'N/A'}
                </TableCell>
                <TableCell align="center">
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<VisibilityIcon />}
                    onClick={() => handleViewDetails(pred)}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(event, value) => setPage(value)}
            color="primary"
          />
        </Box>
      )}

      {/* Details Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Prediction Details</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedPrediction && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  ID
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                  {selectedPrediction.id}
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Timestamp
                </Typography>
                <Typography variant="body1">
                  {selectedPrediction.timestamp 
                    ? new Date(selectedPrediction.timestamp).toLocaleString()
                    : 'Unknown'}
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Prediction
                </Typography>
                <Chip
                  label={selectedPrediction.prediction}
                  color={selectedPrediction.prediction === 'Spam' ? 'error' : 'success'}
                  sx={{ mt: 1 }}
                />
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Confidence
                </Typography>
                <Typography variant="body1">
                  {selectedPrediction.confidence_percentage?.toFixed(2)}%
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Email Text (First 200 chars)
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  value={selectedPrediction.email_text || selectedPrediction.text || ''}
                  InputProps={{
                    readOnly: true,
                  }}
                  variant="outlined"
                  size="small"
                  sx={{ mt: 1 }}
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default PredictionHistory;
