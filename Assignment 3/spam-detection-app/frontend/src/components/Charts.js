import React, { useState, useEffect, useRef } from 'react';
import {
  Paper, Typography, Grid, Box, Card, CardContent, Button, ButtonGroup
} from '@mui/material';
import {
  Download as DownloadIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { Pie, Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
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
  Tooltip,
  Legend
);

function Charts({ predictions }) {
  const [modelInfo, setModelInfo] = useState(null);
  const [chartFilter, setChartFilter] = useState('all'); // 'all', 'distribution', 'performance'
  const pieChartRef = useRef(null);
  const confidenceChartRef = useRef(null);
  const timelineChartRef = useRef(null);
  const performanceChartRef = useRef(null);
  const confusionMatrixRef = useRef(null);

  useEffect(() => {
    // Fetch model information from backend
    axios.get('http://localhost:8000/model-info')
      .then(response => setModelInfo(response.data))
      .catch(err => console.error('Failed to fetch model info:', err));
  }, []);

  // Calculate statistics
  const spamCount = predictions.filter(p => p.prediction === 'Spam').length;
  const hamCount = predictions.filter(p => p.prediction === 'Ham').length;
  const avgConfidence = predictions.length > 0 
    ? predictions.reduce((sum, p) => sum + p.confidence_percentage, 0) / predictions.length 
    : 0;

  // Export data as CSV
  const exportToCSV = () => {
    const headers = ['Timestamp', 'Prediction', 'Confidence (%)', 'Email Text'];
    const csvContent = [
      headers.join(','),
      ...predictions.map(p => [
        new Date(p.timestamp).toLocaleString(),
        p.prediction,
        p.confidence_percentage.toFixed(2),
        `"${p.text.replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spam_detection_results_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Export chart as image
  const exportChartAsImage = (chartRef, filename) => {
    if (chartRef.current) {
      const url = chartRef.current.toBase64Image();
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}_${new Date().toISOString().split('T')[0]}.png`;
      a.click();
    }
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'white',
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      }
    }
  };

  // Pie Chart Data
  const pieData = {
    labels: ['Spam', 'Ham'],
    datasets: [
      {
        data: [spamCount, hamCount],
        backgroundColor: ['#f44336', '#4caf50'],
        borderWidth: 2,
        borderColor: '#fff',
        hoverOffset: 4
      }
    ]
  };

  // Confidence Bar Chart
  const confidenceData = {
    labels: predictions.map((_, i) => `Email ${i + 1}`),
    datasets: [
      {
        label: 'Confidence %',
        data: predictions.map(p => p.confidence_percentage),
        backgroundColor: predictions.map(p => p.prediction === 'Spam' ? '#f4433680' : '#4caf5080'),
        borderColor: predictions.map(p => p.prediction === 'Spam' ? '#f44336' : '#4caf50'),
        borderWidth: 2
      }
    ]
  };

  // Timeline Chart - Shows predictions over time
  const timelineData = {
    labels: predictions.map(p => new Date(p.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'Spam Confidence',
        data: predictions.map(p => p.prediction === 'Spam' ? p.confidence_percentage : 0),
        borderColor: '#f44336',
        backgroundColor: '#f4433640',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Ham Confidence',
        data: predictions.map(p => p.prediction === 'Ham' ? p.confidence_percentage : 0),
        borderColor: '#4caf50',
        backgroundColor: '#4caf5040',
        fill: true,
        tension: 0.4
      }
    ]
  };

  // Model Performance Metrics (from Assignment 2 - Linear SVM)
  const metricsData = modelInfo ? {
    labels: ['Precision (Ham)', 'Precision (Spam)', 'Recall (Ham)', 'Recall (Spam)', 'F1 (Ham)', 'F1 (Spam)'],
    datasets: [
      {
        label: 'Performance Metrics (%)',
        data: [
          modelInfo.precision_ham * 100,
          modelInfo.precision_spam * 100,
          modelInfo.recall_ham * 100,
          modelInfo.recall_spam * 100,
          modelInfo.f1_ham * 100,
          modelInfo.f1_spam * 100
        ],
        backgroundColor: [
          '#1976d2',
          '#1565c0',
          '#0d47a1',
          '#42a5f5',
          '#64b5f6',
          '#90caf9'
        ],
        borderColor: '#1565c0',
        borderWidth: 2
      }
    ]
  } : null;

  // Confusion Matrix Visualization (from model training)
  const confusionMatrixData = modelInfo ? {
    labels: ['Ham (Predicted)', 'Spam (Predicted)'],
    datasets: [
      {
        label: 'Ham (Actual)',
        data: [30374, 4717], // True Negatives, False Positives from Linear SVM
        backgroundColor: '#4caf50',
        borderWidth: 2,
        borderColor: '#fff'
      },
      {
        label: 'Spam (Actual)',
        data: [2055, 34166], // False Negatives, True Positives from Linear SVM
        backgroundColor: '#f44336',
        borderWidth: 2,
        borderColor: '#fff'
      }
    ]
  } : null;

  if (predictions.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mt: 4 }}>
      {/* Header with Export Options */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssessmentIcon /> Classification Results & Analytics
        </Typography>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={exportToCSV}
          sx={{ bgcolor: '#1976d2' }}
        >
          Export Data (CSV)
        </Button>
      </Box>

      {/* Chart Filter Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <ButtonGroup variant="contained" size="large">
          <Button
            onClick={() => setChartFilter('all')}
            sx={{
              bgcolor: chartFilter === 'all' ? '#1e3a5f' : 'white',
              color: chartFilter === 'all' ? 'white' : '#1e3a5f',
              fontWeight: 'bold',
              px: 4,
              '&:hover': {
                bgcolor: chartFilter === 'all' ? '#2d4a6e' : '#e3f2fd'
              }
            }}
          >
            All Charts
          </Button>
          <Button
            onClick={() => setChartFilter('distribution')}
            sx={{
              bgcolor: chartFilter === 'distribution' ? '#1e3a5f' : 'white',
              color: chartFilter === 'distribution' ? 'white' : '#1e3a5f',
              fontWeight: 'bold',
              px: 4,
              '&:hover': {
                bgcolor: chartFilter === 'distribution' ? '#2d4a6e' : '#e3f2fd'
              }
            }}
          >
            Distribution
          </Button>
          <Button
            onClick={() => setChartFilter('performance')}
            sx={{
              bgcolor: chartFilter === 'performance' ? '#1e3a5f' : 'white',
              color: chartFilter === 'performance' ? 'white' : '#1e3a5f',
              fontWeight: 'bold',
              px: 4,
              '&:hover': {
                bgcolor: chartFilter === 'performance' ? '#2d4a6e' : '#e3f2fd'
              }
            }}
          >
            Performance
          </Button>
        </ButtonGroup>
      </Box>

      {/* Summary Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#e3f2fd', borderLeft: '4px solid #1976d2' }}>
            <CardContent>
              <Typography color="text.secondary" variant="subtitle2" gutterBottom>
                Total Classifications
              </Typography>
              <Typography variant="h3" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                {predictions.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#ffebee', borderLeft: '4px solid #f44336' }}>
            <CardContent>
              <Typography color="text.secondary" variant="subtitle2" gutterBottom>
                Spam Detected
              </Typography>
              <Typography variant="h3" sx={{ color: '#f44336', fontWeight: 'bold' }}>
                {spamCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {predictions.length > 0 ? ((spamCount / predictions.length) * 100).toFixed(1) : 0}% of total
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#e8f5e9', borderLeft: '4px solid #4caf50' }}>
            <CardContent>
              <Typography color="text.secondary" variant="subtitle2" gutterBottom>
                Average Confidence
              </Typography>
              <Typography variant="h3" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                {avgConfidence.toFixed(1)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Model certainty score
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Grid */}
      <Grid container spacing={3}>
        {/* Pie Chart - Distribution */}
        {(chartFilter === 'all' || chartFilter === 'distribution') && (
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, bgcolor: '#1e3a5f', color: 'white' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                  Spam vs Ham Distribution
                </Typography>
                <Button
                  size="small"
                  startIcon={<DownloadIcon fontSize="small" />}
                  onClick={() => exportChartAsImage(pieChartRef, 'distribution_chart')}
                  sx={{ color: 'white', borderColor: 'white', fontSize: '0.75rem', py: 0.5, px: 1 }}
                  variant="outlined"
                >
                  Save
                </Button>
              </Box>
              <Box sx={{ height: 300 }}>
                <Pie ref={pieChartRef} data={pieData} options={chartOptions} />
              </Box>
            </Paper>
          </Grid>
        )}

        {/* Confidence Bar Chart */}
        {(chartFilter === 'all' || chartFilter === 'distribution') && (
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, bgcolor: '#1e3a5f', color: 'white' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                  Classification Confidence Levels
                </Typography>
                <Button
                  size="small"
                  startIcon={<DownloadIcon fontSize="small" />}
                  onClick={() => exportChartAsImage(confidenceChartRef, 'confidence_chart')}
                  sx={{ color: 'white', borderColor: 'white', fontSize: '0.75rem', py: 0.5, px: 1 }}
                  variant="outlined"
                >
                  Save
                </Button>
              </Box>
              <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Box sx={{ width: '100%', height: '100%' }}>
                  <Bar
                    ref={confidenceChartRef}
                    data={confidenceData}
                    options={{
                      ...chartOptions,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 100,
                          grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                          },
                          ticks: {
                            color: 'white'
                          },
                          title: {
                            display: true,
                            text: 'Confidence %',
                            color: 'white',
                            font: {
                              weight: 'bold'
                            }
                          }
                        },
                        x: {
                          grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                          },
                          ticks: {
                            color: 'white'
                          },
                          title: {
                            display: true,
                            text: 'Email Samples',
                            color: 'white',
                            font: {
                              weight: 'bold'
                            }
                          }
                        }
                      },
                      plugins: {
                        legend: {
                          labels: {
                            color: 'white'
                          }
                        }
                      }
                    }}
                  />
                </Box>
              </Box>
            </Paper>
          </Grid>
        )}

        {/* Timeline Chart */}
        {(chartFilter === 'all' || chartFilter === 'distribution') && (
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 3, bgcolor: '#1e3a5f', color: 'white' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                  Prediction Timeline
                </Typography>
                <Button
                  size="small"
                  startIcon={<DownloadIcon fontSize="small" />}
                  onClick={() => exportChartAsImage(timelineChartRef, 'timeline_chart')}
                  sx={{ color: 'white', borderColor: 'white', fontSize: '0.75rem', py: 0.5, px: 1 }}
                  variant="outlined"
                >
                  Save
                </Button>
              </Box>
              <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Box sx={{ width: '100%', height: '100%' }}>
                  <Line
                    ref={timelineChartRef}
                    data={timelineData}
                    options={{
                      ...chartOptions,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 100,
                          grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                          },
                          ticks: {
                            color: 'white'
                          },
                          title: {
                            display: true,
                            text: 'Confidence %',
                            color: 'white',
                            font: {
                              weight: 'bold'
                            }
                          }
                        },
                        x: {
                          grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                          },
                          ticks: {
                            color: 'white'
                          },
                          title: {
                            display: true,
                            text: 'Time',
                            color: 'white',
                            font: {
                              weight: 'bold'
                            }
                          }
                        }
                      },
                      plugins: {
                        legend: {
                          labels: {
                            color: 'white'
                          }
                        }
                      }
                    }}
                  />
                </Box>
              </Box>
            </Paper>
          </Grid>
        )}

        {/* Model Performance Metrics - Linear SVM */}
        {metricsData && (chartFilter === 'all' || chartFilter === 'performance') && (
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, bgcolor: '#1e3a5f', color: 'white' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                    Linear SVM Model Performance
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Accuracy: {modelInfo.accuracy}% | Trained on 89,174 emails
                  </Typography>
                </Box>
                <Button
                  size="small"
                  startIcon={<DownloadIcon fontSize="small" />}
                  onClick={() => exportChartAsImage(performanceChartRef, 'performance_metrics')}
                  sx={{ color: 'white', borderColor: 'white', fontSize: '0.75rem', py: 0.5, px: 1 }}
                  variant="outlined"
                >
                  Save
                </Button>
              </Box>
              <Box sx={{ height: 300 }}>
                <Bar
                  ref={performanceChartRef}
                  data={metricsData}
                  options={{
                    ...chartOptions,
                    indexAxis: 'y',
                    scales: {
                      x: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                          color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                          color: 'white'
                        },
                        title: {
                          display: true,
                          text: 'Score %',
                          color: 'white',
                          font: {
                            weight: 'bold'
                          }
                        }
                      },
                      y: {
                        grid: {
                          color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                          color: 'white'
                        }
                      }
                    },
                    plugins: {
                      legend: {
                        labels: {
                          color: 'white'
                        }
                      }
                    }
                  }}
                />
              </Box>
            </Paper>
          </Grid>
        )}

        {/* Confusion Matrix */}
        {confusionMatrixData && (chartFilter === 'all' || chartFilter === 'performance') && (
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, bgcolor: '#1e3a5f', color: 'white' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                    Confusion Matrix (Test Set)
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Training results from Assignment 2
                  </Typography>
                </Box>
                <Button
                  size="small"
                  startIcon={<DownloadIcon fontSize="small" />}
                  onClick={() => exportChartAsImage(confusionMatrixRef, 'confusion_matrix')}
                  sx={{ color: 'white', borderColor: 'white', fontSize: '0.75rem', py: 0.5, px: 1 }}
                  variant="outlined"
                >
                  Save
                </Button>
              </Box>
              <Box sx={{ height: 300 }}>
                <Bar
                  ref={confusionMatrixRef}
                  data={confusionMatrixData}
                  options={{
                    ...chartOptions,
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                          color: 'white'
                        },
                        title: {
                          display: true,
                          text: 'Number of Emails',
                          color: 'white',
                          font: {
                            weight: 'bold'
                          }
                        }
                      },
                      x: {
                        grid: {
                          color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                          color: 'white'
                        }
                      }
                    },
                    plugins: {
                      legend: {
                        labels: {
                          color: 'white'
                        }
                      }
                    }
                  }}
                />
              </Box>
              <Box sx={{ mt: 2, p: 2, bgcolor: '#2d4a6e', borderRadius: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" display="block" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      True Negatives (Ham → Ham):
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#4caf50' }}>30,374</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" display="block" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      False Positives (Ham → Spam):
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#ff9800' }}>4,717</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" display="block" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      False Negatives (Spam → Ham):
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#ff9800' }}>2,055</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" display="block" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      True Positives (Spam → Spam):
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#4caf50' }}>34,166</Typography>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Model Information Card */}
      {modelInfo && (
        <Card sx={{ mt: 3, bgcolor: '#1e3a5f', color: 'white', borderLeft: '4px solid #64b5f6' }}>
          <CardContent>
            <Typography variant="h6" sx={{ color: 'white', mb: 2, fontWeight: 'bold' }}>
              Model Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Model Type</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'white' }}>Linear SVM</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Overall Accuracy</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                  {modelInfo.accuracy}%
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Training Set Size</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'white' }}>17,835 emails</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Test Set Size</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'white' }}>71,339 emails</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

export default Charts;
