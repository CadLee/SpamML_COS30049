import React, { useState, useEffect, useRef } from 'react';
import {
  Paper, Typography, Grid, Box, Card, CardContent, Button, ButtonGroup, IconButton,
  Drawer, Divider, Slider, Tooltip
} from '@mui/material';
import {
  Download as DownloadIcon,
  Assessment as AssessmentIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  RestartAlt as RestartAltIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { Pie, Bar, Line, Chart } from 'react-chartjs-2';
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
  Legend
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';

import axios from 'axios';

// Register Chart.js components including zoom plugin
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
  zoomPlugin
);

function getHistogramData(predictions, binType = "hour") {
  if (!predictions.length) return { labels: [], data: [] };
  const bins = {};
  predictions.forEach(p => {
    const date = new Date(p.timestamp);
    let label;
    if (binType === "hour") {
      label = date.toLocaleDateString() + " " + date.getHours() + ":00";
    } else {
      label = date.toLocaleDateString();
    }
    bins[label] = (bins[label] || 0) + 1;
  });
  const sortedLabels = Object.keys(bins).sort((a, b) => new Date(a) - new Date(b));
  const data = sortedLabels.map(label => bins[label]);
  return { labels: sortedLabels, data };
}

function getConfidenceDistribution(predictions, binSize = 10) {
  const binsCount = Math.ceil(100 / binSize);
  const bins = new Array(binsCount).fill(0);

  predictions.forEach(p => {
    if (p.confidence_percentage !== undefined) {
      let binIndex = Math.min(Math.floor(p.confidence_percentage / binSize), binsCount - 1);
      bins[binIndex]++;
    }
  });

  const labels = bins.map((_, i) => `${i * binSize}-${(i + 1) * binSize}%`);

  return { labels, data: bins };
}

function extractTopWords(predictions, type, topN = 10) {
  const filtered = predictions.filter(p => p.prediction === type);
  
  const stopwords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'is', 'was', 'are', 'be', 'been', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might',
    'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it',
    'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why', 'how',
    'from', 'by', 'about', 'as', 'into', 'through', 'during', 'before',
    'after', 'above', 'below', 'up', 'down', 'out', 'off', 'over', 'under',
    'hey', 'hello', 'hi'
  ]);
  
  const wordFreq = {};
  
  filtered.forEach(pred => {
    const text = pred.text || pred.email_text || '';
    const words = text.toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopwords.has(word));
    
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
  });
  
  const sorted = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN);
  
  return sorted.map(([word, count]) => ({ word, count }));
}


function Charts({ predictions }) {
  const [modelInfo, setModelInfo] = useState(null);
  const [chartFilter, setChartFilter] = useState('all');
  
  //  Zoom and Metrics Panel states
  const [zoomLevel, setZoomLevel] = useState(100);
  const [metricsOpen, setMetricsOpen] = useState(false);
  
  const pieChartRef = useRef(null);
  const confidenceChartRef = useRef(null);
  const spamWordChartRef = useRef(null);
  const hamWordChartRef = useRef(null);
  const timelineChartRef = useRef(null);
  const performanceChartRef = useRef(null);
  const confusionMatrixRef = useRef(null);

  useEffect(() => {
    axios.get('http://localhost:8000/model-info')
      .then(response => setModelInfo(response.data))
      .catch(err => console.error('Failed to fetch model info:', err));
  }, []);

  //  Apply zoom to all charts
  
useEffect(() => {
  const chartRefs = [
    pieChartRef, confidenceChartRef, spamWordChartRef, hamWordChartRef,
    timelineChartRef, performanceChartRef, confusionMatrixRef
  ];

  chartRefs.forEach(ref => {
    if (ref.current) {
      const chart = ref.current;
      if (chart.resetZoom) {
        chart.resetZoom();
      }
      if (chart.zoom && zoomLevel !== 100) {
        chart.zoom(zoomLevel / 100);
      }
    }
  });
}, [zoomLevel]);

  //  Zoom control functions
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 10, 150));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 10, 50));
  };

  const handleResetZoom = () => {
    setZoomLevel(100);
    const chartRefs = [
      pieChartRef, confidenceChartRef, spamWordChartRef, hamWordChartRef,
      timelineChartRef, performanceChartRef, confusionMatrixRef
    ];
    chartRefs.forEach(ref => {
      if (ref.current && ref.current.resetZoom) {
        ref.current.resetZoom();
      }
    });
  };

  // Calculate statistics
  const spamCount = predictions.filter(p => p.prediction === 'Spam').length;
  const hamCount = predictions.filter(p => p.prediction === 'Ham').length;
  const avConfidence = predictions.length > 0 
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

  //  Chart options with zoom plugin enabled
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
      },
      zoom: {
        zoom: {
          wheel: {
            enabled: true,
            speed: 0.1
          },
          pinch: {
            enabled: true
          },
          mode: 'xy'
        },
        pan: {
          enabled: true,
          mode: 'xy'
        },
        limits: {
          x: { min: 0.5, max: 1.5 },
          y: { min: 0.5, max: 1.5 }
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

  const lastTenPredictions = predictions.slice(-10);

  // Confidence Bar Chart
  const confidenceData = {
    labels: lastTenPredictions.map((p, i) => `Email ${predictions.length - 9 + i}`),
    datasets: [{
      label: 'Confidence %',
      data: lastTenPredictions.map(p => p.confidence_percentage),
      backgroundColor: lastTenPredictions.map(p => p.prediction === 'Spam' ? '#f4433680' : '#4caf5080'),
      borderColor: lastTenPredictions.map(p => p.prediction === 'Spam' ? '#f44336' : '#4caf50'),
      borderWidth: 2
    }]
  };

  // Timeline Chart
  const timelineData = {
    labels: predictions.map(p => new Date(p.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'Spam Confidence',
        data: predictions.map(p => p.prediction === 'Spam' ? p.confidence_percentage : 0),
        borderColor: '#f44336',
        backgroundColor: '#f4433640',
        fill: true,
        tension: 0
      },
      {
        label: 'Ham Confidence',
        data: predictions.map(p => p.prediction === 'Ham' ? p.confidence_percentage : 0),
        borderColor: '#4caf50',
        backgroundColor: '#4caf5040',
        fill: true,
        tension: 0
      }
    ]
  };

  // Histogram Bar Chart Data
  const histogram = getHistogramData(predictions, 'hour');
  const histogramData = {
    labels: histogram.labels,
    datasets: [{
      label: "Predictions per Hour",
      data: histogram.data,
      backgroundColor: "#1976d2bb",
      borderColor: "#1976d2",
      borderWidth: 1,
    }]
  };

  // Model Performance Metrics
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

  // Confusion Matrix
  const confusionMatrixData = modelInfo ? {
    labels: ['Ham (Predicted)', 'Spam (Predicted)'],
    datasets: [
      {
        label: 'Ham (Actual)',
        data: [30374, 4717],
        backgroundColor: '#4caf50',
        borderWidth: 2,
        borderColor: '#fff'
      },
      {
        label: 'Spam (Actual)',
        data: [2055, 34166],
        backgroundColor: '#f44336',
        borderWidth: 2,
        borderColor: '#fff'
      }
    ]
  } : null;

  const { labels: confidenceLabels, data: confidenceChartData } = getConfidenceDistribution(predictions, 10);

  const confidenceDistributionData = {
    labels: confidenceLabels,
    datasets: [
      {
        label: 'Number of Predictions',
        data: confidenceChartData,
        backgroundColor: '#1976d2',
        borderColor: '#1565c0',
        borderWidth: 1,
      },
    ],
  };

  const confidenceDistributionOptions = {
    responsive: true,
    plugins: {
      legend: {
        labels: { color: 'white', font: { weight: 'bold' } }
      },
      title: {
        display: true,
        text: 'Confidence Distribution',
        color: 'white',
        font: { size: 16, weight: 'bold' }
      },
      zoom: chartOptions.plugins.zoom
    },
    scales: {
      x: {
        ticks: { color: 'white' },
        title: { display: true, text: 'Confidence Interval', color: 'white' }
      },
      y: {
        beginAtZero: true,
        ticks: { color: 'white' },
        title: { display: true, text: 'Prediction Count', color: 'white' }
      },
    },
  };

  // Word frequency charts
  const spamWords = extractTopWords(predictions, 'Spam', 10);
  const hamWords = extractTopWords(predictions, 'Ham', 10);

  const spamWordsData = {
    labels: spamWords.map(w => w.word),
    datasets: [{
      label: 'Frequency in Spam Emails',
      data: spamWords.map(w => w.count),
      backgroundColor: '#f4433680',
      borderColor: '#f44336',
      borderWidth: 2,
      borderRadius: 4,
    }]
  };

  const spamWordsOptions = {
    indexAxis: 'x',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: 'white', font: { weight: 'bold' } }
      },
      title: {
        display: true,
        text: 'Top 10 Common Words in Spam Emails',
        color: 'white',
        font: { size: 14, weight: 'bold' }
      },
      zoom: chartOptions.plugins.zoom
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { 
          color: 'white',
          minStepSize: 1,
          callback: function(value) {
            if (Number.isInteger(value)) {
              return value;
            }
          }
        },
        title: { display: true, text: 'Frequency', color: 'white' }
      },
      x: {
        ticks: { 
          color: 'white',
          font: { size: 12 },
          maxRotation: 45,
          minRotation: 45
        }
      }
    }
  };

  const hamWordsData = {
    labels: hamWords.map(w => w.word),
    datasets: [{
      label: 'Frequency in Ham Emails',
      data: hamWords.map(w => w.count),
      backgroundColor: '#4caf5080',
      borderColor: '#4caf50',
      borderWidth: 2,
      borderRadius: 4,
    }]
  };

  const hamWordsOptions = {
    indexAxis: 'x',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: 'white', font: { weight: 'bold' } }
      },
      title: {
        display: true,
        text: 'Top 10 Common Words in Ham Emails',
        color: 'white',
        font: { size: 14, weight: 'bold' }
      },
      zoom: chartOptions.plugins.zoom
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { 
          color: 'white',
          minStepSize: 1,
          callback: function(value) {
            if (Number.isInteger(value)) {
              return value;
            }
          }
        },
        title: { display: true, text: 'Frequency', color: 'white' }
      },
      x: {
        ticks: { 
          color: 'white',
          font: { size: 12 },
          maxRotation: 45,
          minRotation: 45
        }
      }
    }
  };

  const confidenceLineData = {
    labels: lastTenPredictions.map((p, i) => `Email ${predictions.length - 9 + i}`),
    datasets: [
      {
        label: 'Spam Confidence',
        data: lastTenPredictions.map(p => p.prediction === 'Spam' ? p.confidence_percentage : null),
        borderColor: '#f44336',
        backgroundColor: '#f4433640',
        fill: true,
        tension: 0.3,
        pointRadius: 6,
        pointBackgroundColor: '#f44336',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
      {
        label: 'Ham Confidence',
        data: lastTenPredictions.map(p => p.prediction === 'Ham' ? p.confidence_percentage : null),
        borderColor: '#4caf50',
        backgroundColor: '#4caf5040',
        fill: true,
        tension: 0.3,
        pointRadius: 6,
        pointBackgroundColor: '#4caf50',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      }
    ]
  };

  const confidenceLineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: 'white', font: { weight: 'bold' } }
      },
      title: {
        display: true,
        text: 'Classification Confidence Trend (Last 10 Emails)',
        color: 'white',
        font: { size: 14, weight: 'bold' }
      },
      zoom: chartOptions.plugins.zoom
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: { 
          color: 'white',
          stepSize: 10,
          callback: function(value) {
            return value + '%';
          }
        },
        title: { display: true, text: 'Confidence %', color: 'white' }
      },
      x: {
        ticks: { 
          color: 'white',
          font: { size: 11 },
          maxRotation: 45,
          minRotation: 0
        }
      }
    }
  };

  // Box Plot Data
  const allConfidences = predictions.length > 0 
    ? predictions.map(p => p.confidence_percentage) 
    : [0];

  const sorted = [...allConfidences].sort((a, b) => a - b);
  const n = sorted.length;

  const minVal = sorted[0];
  const q1Val = sorted[Math.floor(n * 0.25)];
  const medianVal = sorted[Math.floor(n * 0.5)];
  const q3Val = sorted[Math.floor(n * 0.75)];
  const maxVal = sorted[n - 1];
  const meanVal = allConfidences.reduce((a, b) => a + b) / n;

  const boxPlotData = {
    labels: ['Min', 'Q1', 'Median', 'Average', 'Q3', 'Max'],
    datasets: [{
      label: 'Confidence Values (%)',
      data: [minVal, q1Val, medianVal, meanVal, q3Val, maxVal],
      backgroundColor: [
        '#f44336',
        '#ff9800',
        '#2196f3',
        '#1976d2',
        '#4caf50',
        '#4caf50'
      ],
      borderColor: [
        '#d32f2f', '#f57c00', '#1565c0', '#1565c0', '#388e3c', '#388e3c'
      ],
      borderWidth: 2,
      borderRadius: 4
    }]
  };

  const boxPlotOptions = {
    indexAxis: 'x',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: 'white', font: { weight: 'bold' } } },
      title: {
        display: true,
        text: 'Confidence Statistics (All Predictions)',
        color: 'white',
        font: { size: 14, weight: 'bold' }
      },
      zoom: chartOptions.plugins.zoom
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: { 
          color: 'white',
          stepSize: 10,
          callback: function(value) { return value + '%'; }
        },
        title: { display: true, text: 'Confidence (%)', color: 'white' }
      },
      x: { ticks: { color: 'white', font: { size: 12, weight: 'bold' } } }
    }
  };

  const boxPlotStats = {
    lowerExtreme: minVal.toFixed(2),
    lowerQuartile: q1Val.toFixed(2),
    median: medianVal.toFixed(2),
    upperQuartile: q3Val.toFixed(2),
    upperExtreme: maxVal.toFixed(2),
    mean: meanVal.toFixed(2)
  };

  if (predictions.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mt: 4 }} >
      {/* Header with Export Options and NEW Zoom Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssessmentIcon /> Classification Results & Analytics
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          {/*  Zoom Controls */}
          <Paper elevation={2} sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1, gap: 1 }}>
            <Tooltip title="Zoom Out (50% min)">
              <IconButton onClick={handleZoomOut} disabled={zoomLevel <= 50} size="small">
                <ZoomOutIcon />
              </IconButton>
            </Tooltip>
            
            <Box sx={{ minWidth: 120, mx: 1 }} >
              <Slider
                value={zoomLevel}
                onChange={(e, newValue) => setZoomLevel(newValue)}
                min={50}
                max={150}
                step={10}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value}%`}
                sx={{ color: 'primary.main' }}
              />
            </Box>
            
            <Typography variant="body2" sx={{ minWidth: 45, fontWeight: 'bold' }}>
              {zoomLevel}%
            </Typography>
            
            <Tooltip title="Zoom In (150% max)">
              <IconButton onClick={handleZoomIn} disabled={zoomLevel >= 150} size="small">
                <ZoomInIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Reset Zoom">
              <IconButton onClick={handleResetZoom} size="small" color="primary">
                <RestartAltIcon />
              </IconButton>
            </Tooltip>
          </Paper>

          {/*  Metrics Panel Button */}
          <Button
            variant="contained"
            onClick={() => setMetricsOpen(true)}
            sx={{ bgcolor: '#1e3a5f' }}
          >
            Metrics Panel
          </Button>
          
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={exportToCSV}
            sx={{ bgcolor: '#1976d2' }}
          >
            Export Data (CSV)
          </Button>
        </Box>
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
                {avConfidence.toFixed(1)}%
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
        {/* Pie Chart */}
        {(chartFilter === 'all' || chartFilter === 'distribution') && (
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, bgcolor: '#1e3a5f', color: 'white' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                  Spam vs Ham Distribution
                </Typography>
                <IconButton
                  onClick={() => exportChartAsImage(pieChartRef, 'distribution_chart')}
                  sx={{ color: 'white' }}
                  size="small"
                >
                  <DownloadIcon />
                </IconButton>
              </Box>
              <Box sx={{ height: 300 }} >
                <Pie ref={pieChartRef} data={pieData} options={chartOptions} />
              </Box>
            </Paper>
          </Grid>
        )}

        {/* Confidence Line Chart */}
        {(chartFilter === 'all' || chartFilter === 'distribution') && (
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, bgcolor: '#1e3a5f', color: 'white' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                  Classification Confidence Levels
                </Typography>
                <IconButton
                  onClick={() => exportChartAsImage(confidenceChartRef, 'confidence_chart')}
                  sx={{ color: 'white' }}
                  size="small"
                >
                  <DownloadIcon />
                </IconButton>
              </Box>
              <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }} >
                <Box sx={{ width: '100%', height: '100%' }}>
                  <Line data={confidenceLineData} options={confidenceLineOptions} ref={confidenceChartRef} />
                </Box>
              </Box>
            </Paper>
          </Grid>
        )}

        {/* Spam Words Bar Chart */}
        {(chartFilter === 'all' || chartFilter === 'distribution') && (
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 3, bgcolor: '#1e3a5f', color: 'white' }}>
              <CardContent>
                <Box sx={{ position: 'relative', height: 300 }} >
                  <Box sx={{ position: 'absolute', top: 0, right: -20, zIndex: 1 }}>
                    <IconButton
                      onClick={() => exportChartAsImage(spamWordChartRef, 'spam_words_chart')}
                      sx={{ color: 'white' }}
                      size="small"
                    >
                      <DownloadIcon />
                    </IconButton>
                  </Box>
                  <Bar data={spamWordsData} options={spamWordsOptions} ref={spamWordChartRef} />
                </Box>
              </CardContent>
            </Paper>
          </Grid>
        )}

        {/* Ham Words Bar Chart */}
        {(chartFilter === 'all' || chartFilter === 'distribution') && (
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 3, bgcolor: '#1e3a5f', color: 'white' }}>
              <CardContent>
                <Box sx={{ position: 'relative', height: 300 }}>
                  <Box sx={{ position: 'absolute', top: 0, right: -20, zIndex: 1 }}>
                    <IconButton
                      onClick={() => exportChartAsImage(hamWordChartRef, 'ham_words_chart')}
                      sx={{ color: 'white' }}
                      size="small"
                    >
                      <DownloadIcon />
                    </IconButton>
                  </Box>
                  <Bar data={hamWordsData} options={hamWordsOptions} ref={hamWordChartRef} />
                </Box>
              </CardContent>
            </Paper>
          </Grid>
        )}

        {/* Box Plot Chart */}
        {(chartFilter === 'all' || chartFilter === 'distribution') && (
          <Grid item xs={12} md={6}>
            <Card sx={{ bgcolor: '#2a2a2a' }}>
              <CardContent>
                <Box sx={{ height: 400 }}>
                  <Bar data={boxPlotData} options={boxPlotOptions} ref={performanceChartRef} />
                </Box>
                
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mt: 2 }}>
                  <Box sx={{ p: 1.5, bgcolor: '#1e1e1e', borderRadius: 1, border: '1px solid #f44336' }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#f44336' }}>
                      Lower Extreme (Min)
                    </Typography>
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                      {boxPlotStats.lowerExtreme}%
                    </Typography>
                  </Box>
                  
                  <Box sx={{ p: 1.5, bgcolor: '#1e1e1e', borderRadius: 1, border: '1px solid #ff9800' }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
                      Lower Quartile (Q1)
                    </Typography>
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                      {boxPlotStats.lowerQuartile}%
                    </Typography>
                  </Box>
                  
                  <Box sx={{ p: 1.5, bgcolor: '#1e1e1e', borderRadius: 1, border: '1px solid #2196f3' }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#2196f3' }}>
                      Median
                    </Typography>
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                      {boxPlotStats.median}%
                    </Typography>
                  </Box>
                  
                  <Box sx={{ p: 1.5, bgcolor: '#1e1e1e', borderRadius: 1, border: '1px solid #4caf50' }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                      Upper Quartile (Q3)
                    </Typography>
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                      {boxPlotStats.upperQuartile}%
                    </Typography>
                  </Box>
                  
                  <Box sx={{ p: 1.5, bgcolor: '#1e1e1e', borderRadius: 1, border: '1px solid #4caf50' }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                      Upper Extreme (Max)
                    </Typography>
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                      {boxPlotStats.upperExtreme}%
                    </Typography>
                  </Box>
                  
                  <Box sx={{ p: 1.5, bgcolor: '#1e1e1e', borderRadius: 1, border: '1px solid #1976d2' }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                      Mean
                    </Typography>
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                      {boxPlotStats.mean}%
                    </Typography>
                  </Box>
                </Box>
                
                <Button
                  onClick={() => exportChartAsImage(performanceChartRef, 'confidence_boxplot')}
                  sx={{ color: 'white', borderColor: 'white', fontSize: '0.75rem', py: 0.5, px: 1, mt: 2 }}
                  variant="outlined"
                  size="small"
                >
                  Save Chart
                </Button>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Model Performance Metrics */}
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
                <IconButton
                  onClick={() => exportChartAsImage(performanceChartRef, 'performance_metrics')}
                  sx={{ color: 'white' }}
                  size="small"
                >
                  <DownloadIcon />
                </IconButton>
              </Box>
              <Box sx={{ height: 300 }}>
                <Bar
                  height={300}
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
                      ...chartOptions.plugins,
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
                <IconButton
                  onClick={() => exportChartAsImage(confusionMatrixRef, 'confusion_matrix')}
                  sx={{ color: 'white' }}
                  size="small"
                >
                  <DownloadIcon />
                </IconButton>
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
                      ...chartOptions.plugins,
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

      {/* Metrics Drawer Panel */}
      <Drawer
        anchor="right"
        open={metricsOpen}
        onClose={() => setMetricsOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 400,
            bgcolor: '#1a1a1a',
            color: 'white',
            p: 3
          }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 , color: 'white' }}>
            📊 Key Metrics
          </Typography>
          <IconButton onClick={() => setMetricsOpen(false)} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.2)', mb: 3 }} />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Card sx={{ bgcolor: '#2a2a2a', border: '2px solid #1976d2' }}>
            <CardContent>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                Total Predictions
              </Typography>
              <Typography variant="h3" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                {predictions.length}
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ bgcolor: '#2a2a2a', border: '2px solid #f44336' }}>
            <CardContent>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                Spam Count
              </Typography>
              <Typography variant="h3" sx={{ color: '#f44336', fontWeight: 'bold' }}>
                {spamCount}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                {predictions.length > 0 ? ((spamCount / predictions.length) * 100).toFixed(1) : 0}% of total
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ bgcolor: '#2a2a2a', border: '2px solid #4caf50' }}>
            <CardContent>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                Ham Count
              </Typography>
              <Typography variant="h3" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                {hamCount}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                {predictions.length > 0 ? ((hamCount / predictions.length) * 100).toFixed(1) : 0}% of total
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ bgcolor: '#2a2a2a', border: '2px solid #ff9800' }}>
            <CardContent>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                Average Confidence
              </Typography>
              <Typography variant="h3" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                {avConfidence.toFixed(1)}%
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                Model certainty score
              </Typography>
            </CardContent>
          </Card>

          {modelInfo && (
            <Card sx={{ bgcolor: '#2a2a2a', border: '2px solid #64b5f6' }}>
              <CardContent>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  Model Accuracy
                </Typography>
                <Typography variant="h3" sx={{ color: '#64b5f6', fontWeight: 'bold' }}>
                  {modelInfo.accuracy}%
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                  Linear SVM Performance
                </Typography>
              </CardContent>
            </Card>
          )}
        </Box>

        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.2)', my: 3 }} />

        <Button
          variant="contained"
          fullWidth
          onClick={() => setMetricsOpen(false)}
          sx={{ mt: 2 }}
        >
          Close Panel
        </Button>
      </Drawer>
    </Box>
  );
}

export default Charts;
