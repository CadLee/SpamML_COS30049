import React, { useState, useEffect } from 'react';
import { Paper, Typography, Grid, Box, Card, CardContent } from '@mui/material';
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

  // Pie Chart Data
  const pieData = {
    labels: ['Spam', 'Ham'],
    datasets: [
      {
        data: [spamCount, hamCount],
        backgroundColor: ['#f44336', '#4caf50'],
        borderWidth: 2,
        borderColor: '#fff'
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
        borderWidth: 1
      }
    ]
  };

  // Model Performance Metrics (from Assignment 2)
  const metricsData = modelInfo ? {
    labels: ['Precision (Ham)', 'Precision (Spam)', 'Recall (Ham)', 'Recall (Spam)', 'F1 (Ham)', 'F1 (Spam)'],
    datasets: [
      {
        label: 'Performance Metrics',
        data: [
          modelInfo.precision_ham * 100,
          modelInfo.precision_spam * 100,
          modelInfo.recall_ham * 100,
          modelInfo.recall_spam * 100,
          modelInfo.f1_ham * 100,
          modelInfo.f1_spam * 100
        ],
        backgroundColor: '#1976d2',
        borderColor: '#1565c0',
        borderWidth: 1
      }
    ]
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top',
      }
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Classification Results & Model Performance
      </Typography>

      {/* Summary Statistics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Classifications
              </Typography>
              <Typography variant="h4">
                {predictions.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Spam Detected
              </Typography>
              <Typography variant="h4" color="error">
                {spamCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Average Confidence
              </Typography>
              <Typography variant="h4" color="primary">
                {avgConfidence.toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Pie Chart */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Spam vs Ham Distribution
            </Typography>
            <Box sx={{ height: 300 }}>
              <Pie data={pieData} options={chartOptions} />
            </Box>
          </Paper>
        </Grid>

        {/* Confidence Bar Chart */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Classification Confidence
            </Typography>
            <Box sx={{ height: 300 }}>
              <Bar
                data={confidenceData}
                options={{
                  ...chartOptions,
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                      title: {
                        display: true,
                        text: 'Confidence %'
                      }
                    }
                  }
                }}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Model Performance Metrics */}
        {metricsData && (
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Linear SVM Model Performance (Assignment 2)
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Model Accuracy: {modelInfo.accuracy}%
              </Typography>
              <Box sx={{ height: 300 }}>
                <Bar
                  data={metricsData}
                  options={{
                    ...chartOptions,
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                          display: true,
                          text: 'Score %'
                        }
                      }
                    }
                  }}
                />
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

export default Charts;