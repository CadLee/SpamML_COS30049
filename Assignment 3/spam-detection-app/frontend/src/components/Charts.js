import React, { useState, useEffect, useRef } from 'react';
import { 
  Paper, Typography, Grid, Box, Card, CardContent, Button, 
  ButtonGroup, IconButton, Tooltip, Divider 
} from '@mui/material';
import { 
  Download as DownloadIcon,
  ZoomIn as ZoomInIcon 
} from '@mui/icons-material';
import { Pie, Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler
} from 'chart.js';
import axios from 'axios';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

function Charts({ predictions }) {
  const [modelInfo, setModelInfo] = useState(null);
  const [selectedChart, setSelectedChart] = useState('all');
  const chartRefs = {
    pie: useRef(null),
    confidence: useRef(null),
    timeline: useRef(null),
    confusion: useRef(null),
    metrics: useRef(null)
  };

  useEffect(() => {
    // Fetch model information from backend
    axios.get('http://localhost:8000/model-info')
      .then(response => setModelInfo(response.data))
      .catch(err => console.error('Failed to fetch model info:', err));
  }, []);

  // Calculate statistics
  const spamCount = predictions.filter(p => p.prediction === 'Spam').length;
  const hamCount = predictions.filter(p => p.prediction === 'Ham').length;
  const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence_percentage, 0) / predictions.length;
  const latestPredictions = predictions.slice(-10); // Last 10 for timeline

  // Export chart as image
  const exportChart = (chartRef, filename) => {
    if (chartRef.current) {
      const url = chartRef.current.toBase64Image();
      const link = document.createElement('a');
      link.download = `${filename}_${Date.now()}.png`;
      link.href = url;
      link.click();
    }
  };

  // Chart 1: Pie Chart Data
  const pieData = {
    labels: ['Spam', 'Ham'],
    datasets: [
      {
        data: [spamCount, hamCount],
        backgroundColor: ['#dc2626', '#16a34a'],
        borderColor: ['#ffffff', '#ffffff'],
        borderWidth: 3,
        hoverOffset: 10
      }
    ]
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: { size: 14, weight: 'bold' },
          padding: 15
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  // Chart 2: Confidence Bar Chart
  const confidenceData = {
    labels: predictions.map((_, i) => `#${i + 1}`),
    datasets: [
      {
        label: 'Confidence %',
        data: predictions.map(p => p.confidence_percentage),
        backgroundColor: predictions.map(p => p.prediction === 'Spam' ? '#dc262680' : '#16a34a80'),
        borderColor: predictions.map(p => p.prediction === 'Spam' ? '#dc2626' : '#16a34a'),
        borderWidth: 2
      }
    ]
  };

  const confidenceOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: true },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `Confidence: ${context.parsed.y.toFixed(2)}%`;
          },
          afterLabel: function(context) {
            return `Type: ${predictions[context.dataIndex].prediction}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Confidence %',
          font: { weight: 'bold' }
        }
      },
      x: {
        title: {
          display: true,
          text: 'Email Number',
          font: { weight: 'bold' }
        }
      }
    }
  };

  // Chart 3: Timeline Line Chart
  const timelineData = {
    labels: latestPredictions.map((_, i) => `Email ${predictions.length - latestPredictions.length + i + 1}`),
    datasets: [
      {
        label: 'Confidence Trend',
        data: latestPredictions.map(p => p.confidence_percentage),
        borderColor: '#1e3a8a',
        backgroundColor: 'rgba(30, 58, 138, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: latestPredictions.map(p => p.prediction === 'Spam' ? '#dc2626' : '#16a34a'),
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8
      }
    ]
  };

  const timelineOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: true },
      tooltip: {
        callbacks: {
          title: function(context) {
            return context[0].label;
          },
          label: function(context) {
            return `Confidence: ${context.parsed.y.toFixed(2)}%`;
          },
          afterLabel: function(context) {
            return `Prediction: ${latestPredictions[context.dataIndex].prediction}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Confidence %',
          font: { weight: 'bold' }
        }
      }
    }
  };

  // Chart 4: Confusion Matrix (Simulated with Model Info)
  const confusionMatrixData = modelInfo ? {
    labels: ['Ham (Actual)', 'Spam (Actual)'],
    datasets: [
      {
        label: 'Predicted Ham',
        data: [30374, 2055], // True Negatives, False Negatives
        backgroundColor: '#16a34a80',
        borderColor: '#16a34a',
        borderWidth: 2
      },
      {
        label: 'Predicted Spam',
        data: [4717, 34166], // False Positives, True Positives
        backgroundColor: '#dc262680',
        borderColor: '#dc2626',
        borderWidth: 2
      }
    ]
  } : null;

  const confusionOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.parsed.y;
            const label = context.dataset.label;
            return `${label}: ${value}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Count',
          font: { weight: 'bold' }
        }
      }
    }
  };

  // Chart 5: Model Performance Metrics
  const metricsData = modelInfo ? {
    labels: ['Precision (Ham)', 'Precision (Spam)', 'Recall (Ham)', 'Recall (Spam)', 'F1 (Ham)', 'F1 (Spam)'],
    datasets: [
      {
        label: 'Performance Score (%)',
        data: [
          modelInfo.precision_ham * 100,
          modelInfo.precision_spam * 100,
          modelInfo.recall_ham * 100,
          modelInfo.recall_spam * 100,
          modelInfo.f1_ham * 100,
          modelInfo.f1_spam * 100
        ],
        backgroundColor: [
          '#16a34a80', '#dc262680', '#16a34a80', '#dc262680', '#16a34a80', '#dc262680'
        ],
        borderColor: [
          '#16a34a', '#dc2626', '#16a34a', '#dc2626', '#16a34a', '#dc2626'
        ],
        borderWidth: 2
      }
    ]
  } : null;

  const metricsOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.label}: ${context.parsed.y.toFixed(2)}%`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Score %',
          font: { weight: 'bold' }
        }
      }
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3, bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
          📊 Classification Results & Model Performance
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          Interactive visualizations powered by Chart.js
        </Typography>
      </Paper>

      {/* Summary Statistics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
            <CardContent>
              <Typography color="inherit" gutterBottom sx={{ opacity: 0.9 }}>
                📧 Total Classifications
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                {predictions.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: 'secondary.main', color: 'white' }}>
            <CardContent>
              <Typography color="inherit" gutterBottom sx={{ opacity: 0.9 }}>
                ⚠️ Spam Detected
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                {spamCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
            <CardContent>
              <Typography color="inherit" gutterBottom sx={{ opacity: 0.9 }}>
                📈 Average Confidence
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                {avgConfidence.toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Chart Filter Buttons */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
        <ButtonGroup variant="outlined" sx={{ flexWrap: 'wrap' }}>
          <Button 
            onClick={() => setSelectedChart('all')}
            variant={selectedChart === 'all' ? 'contained' : 'outlined'}
          >
            All Charts
          </Button>
          <Button 
            onClick={() => setSelectedChart('distribution')}
            variant={selectedChart === 'distribution' ? 'contained' : 'outlined'}
          >
            Distribution
          </Button>
          <Button 
            onClick={() => setSelectedChart('performance')}
            variant={selectedChart === 'performance' ? 'contained' : 'outlined'}
          >
            Performance
          </Button>
        </ButtonGroup>
      </Box>

      {/* Charts Grid */}
      <Grid container spacing={3}>
        {/* Chart 1: Pie Chart */}
        {(selectedChart === 'all' || selectedChart === 'distribution') && (
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, position: 'relative' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Spam vs Ham Distribution
                </Typography>
                <Tooltip title="Export Chart">
                  <IconButton size="small" onClick={() => exportChart(chartRefs.pie, 'spam_distribution')}>
                    <DownloadIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box sx={{ height: 300 }}>
                <Pie ref={chartRefs.pie} data={pieData} options={pieOptions} />
              </Box>
            </Paper>
          </Grid>
        )}

        {/* Chart 2: Confidence Bar Chart */}
        {(selectedChart === 'all' || selectedChart === 'distribution') && (
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Classification Confidence
                </Typography>
                <Tooltip title="Export Chart">
                  <IconButton size="small" onClick={() => exportChart(chartRefs.confidence, 'confidence_levels')}>
                    <DownloadIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box sx={{ height: 300 }}>
                <Bar ref={chartRefs.confidence} data={confidenceData} options={confidenceOptions} />
              </Box>
            </Paper>
          </Grid>
        )}

        {/* Chart 3: Timeline Chart */}
        {(selectedChart === 'all' || selectedChart === 'distribution') && (
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  📈 Confidence Timeline (Last {latestPredictions.length} Predictions)
                </Typography>
                <Tooltip title="Export Chart">
                  <IconButton size="small" onClick={() => exportChart(chartRefs.timeline, 'confidence_timeline')}>
                    <DownloadIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box sx={{ height: 300 }}>
                <Line ref={chartRefs.timeline} data={timelineData} options={timelineOptions} />
              </Box>
            </Paper>
          </Grid>
        )}

        {/* Chart 4 & 5: Model Performance (Only show if model info loaded) */}
        {modelInfo && (selectedChart === 'all' || selectedChart === 'performance') && (
          <>
            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Confusion Matrix 
                  </Typography>
                  <Tooltip title="Export Chart">
                    <IconButton size="small" onClick={() => exportChart(chartRefs.confusion, 'confusion_matrix')}>
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Model Accuracy: {modelInfo.accuracy}%
                </Typography>
                <Box sx={{ height: 300 }}>
                  <Bar ref={chartRefs.confusion} data={confusionMatrixData} options={confusionOptions} />
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Model Performance Metrics
                  </Typography>
                  <Tooltip title="Export Chart">
                    <IconButton size="small" onClick={() => exportChart(chartRefs.metrics, 'performance_metrics')}>
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Linear SVM - Assignment 2 Results
                </Typography>
                <Box sx={{ height: 300 }}>
                  <Bar ref={chartRefs.metrics} data={metricsData} options={metricsOptions} />
                </Box>
              </Paper>
            </Grid>
          </>
        )}
      </Grid>

      {/* Model Info Details */}
      {modelInfo && (
        <Paper elevation={2} sx={{ p: 3, mt: 3, bgcolor: 'background.paper' }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
            🎯 Model Performance Summary
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="text.secondary">Accuracy</Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>{modelInfo.accuracy}%</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="text.secondary">Ham Precision</Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                {(modelInfo.precision_ham * 100).toFixed(1)}%
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="text.secondary">Spam Recall</Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'secondary.main' }}>
                {(modelInfo.recall_spam * 100).toFixed(1)}%
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="text.secondary">F1 Score (Avg)</Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {(((modelInfo.f1_ham + modelInfo.f1_spam) / 2) * 100).toFixed(1)}%
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
}

export default Charts;