import React, { useState, useEffect, useRef } from 'react';
import { Paper, Typography, Grid, Box, Card, CardContent, Button, ButtonGroup, IconButton, Tooltip } from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import { Pie, Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, PointElement, LineElement, ArcElement, Title, Tooltip
    as ChartTooltip, Legend, Filler
} from 'chart.js';
import axios from 'axios';

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
    donut: useRef(null),
    histogram: useRef(null),
    timeline: useRef(null),
    confusion: useRef(null),
    metrics: useRef(null),
  };

  useEffect(() => {
    axios.get('http://localhost:8000/model-info')
      .then(response => setModelInfo(response.data))
      .catch(err => console.error('Failed to fetch model info:', err));
  }, []);

  // Summary stats
  const spamCount = predictions.filter(p => p.prediction === 'Spam').length;
  const hamCount = predictions.filter(p => p.prediction === 'Ham').length;
  const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence_percentage, 0) / predictions.length;
  const latestPredictions = predictions.slice(-30); // last 30 emails for timeline

  // Export helper
  const exportChart = (chartRef, filename) => {
    if (chartRef.current) {
      const url = chartRef.current.toBase64Image();
      const link = document.createElement('a');
      link.download = `${filename}_${Date.now()}.png`;
      link.href = url;
      link.click();
    }
  };

  // ---- Chart Data ----

  // Donut chart (Spam vs Ham)
  const donutData = {
    labels: ['Spam', 'Ham'],
    datasets: [{
      data: [spamCount, hamCount],
      backgroundColor: ['#dc2626', '#16a34a'],
      hoverOffset: 10,
      borderColor: '#fff',
      borderWidth: 2
    }]
  };
  const donutOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom', labels: { font: { weight: 'bold' } } },
      tooltip: {
        callbacks: {
          label: ctx => {
            const total = ctx.dataset.data.reduce((a,b)=>a+b,0);
            const pct = ((ctx.parsed/total)*100).toFixed(1);
            return `${ctx.label}: ${ctx.parsed} (${pct}%)`;
          }
        }
      }
    }
  };

  // Confidence histogram (binned)

  // Initialises empty chart prior to predictions.
  const [histogramData, setHistogramData] = useState({
    labels: [],
    datasets: [{ label: 'Count', data: [], backgroundColor: '#1e3a8a80', borderColor: '#1e3a8a', borderWidth: 2 }]
  });

  // Ensures chart is dynamically updated once prediction occurs.
  useEffect(() => {
    const bins = [0, 20, 40, 60, 80, 100];
    const binCounts = bins.map((b, i) => {
      if (i === bins.length - 1) return predictions.filter(p => p.confidence_percentage >= b).length;
      return predictions.filter(p => p.confidence_percentage >= b && p.confidence_percentage < bins[i + 1]).length;
    });

    setHistogramData({
      labels: ['0-20%', '20-40%', '40-60%', '60-80%', '80-100%'],
      datasets: [{
        label: 'Count',
        data: binCounts,
        backgroundColor: '#1e3a8a80',
        borderColor: '#1e3a8a',
        borderWidth: 2
      }]
    });
  }, [predictions]);
  
  const histogramOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    maintainAspectRatio: false,
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Count', font: { weight: 'bold' } } },
      x: { title: { display: true, text: 'Confidence Range', font: { weight: 'bold' } } }
    }
  };

  // Confidence timeline
  const timelineData = {
    labels: latestPredictions.map((_, i) => `#${predictions.length - latestPredictions.length + i + 1}`),
    datasets: [{
      label: 'Confidence %',
      data: latestPredictions.map(p => p.confidence_percentage),
      borderColor: '#1e3a8a',
      backgroundColor: 'rgba(30,58,138,0.1)',
      fill: true,
      tension: 0.3,
      pointBackgroundColor: latestPredictions.map(p => p.prediction === 'Spam' ? '#dc2626' : '#16a34a'),
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 5
    }]
  };
  const timelineOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    maintainAspectRatio: false,
    scales: {
      y: { beginAtZero: true, max: 100, title: { display: true, text: 'Confidence %', font: { weight: 'bold' } } }
    }
  };

  // Confusion matrix as horizontal bar (heatmap feel)
  const confusionMatrixData = modelInfo ? {
    labels: ['Ham', 'Spam'],
    datasets: [
      {
        label: 'Predicted Ham',
        data: [30374, 2055],
        backgroundColor: ['#16a34a80','#16a34a80'],
        borderColor: '#16a34a',
        borderWidth: 1
      },
      {
        label: 'Predicted Spam',
        data: [4717, 34166],
        backgroundColor: ['#dc262680','#dc262680'],
        borderColor: '#dc2626',
        borderWidth: 1
      }
    ]
  } : null;
  const confusionOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' } },
    scales: {
      x: { beginAtZero: true, title: { display: true, text: 'Count', font: { weight: 'bold' } } },
      y: { stacked: true }
    }
  };

  // Performance metrics as horizontal bar
  const metricsData = modelInfo ? {
    labels: ['Precision Ham','Precision Spam','Recall Ham','Recall Spam','F1 Ham','F1 Spam'],
    datasets: [{
      label: 'Score %',
      data: [
        modelInfo.precision_ham*100,
        modelInfo.precision_spam*100,
        modelInfo.recall_ham*100,
        modelInfo.recall_spam*100,
        modelInfo.f1_ham*100,
        modelInfo.f1_spam*100
      ],
      backgroundColor: ['#16a34a80','#dc262680','#16a34a80','#dc262680','#16a34a80','#dc262680'],
      borderColor: ['#16a34a','#dc2626','#16a34a','#dc2626','#16a34a','#dc2626'],
      borderWidth: 1
    }]
  } : null;
  const metricsOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { beginAtZero: true, max: 100, title: { display: true, text: 'Score %', font: { weight: 'bold' } } } }
  };

  return (
    <Box sx={{ mt: 5, mb: 5 }}>
      {/* Header */}
      <Paper elevation={3} sx={{ p:3, mb:4, borderRadius:3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>📊 Classification Results & Model Performance</Typography>
        <Typography variant="body2" sx={{ opacity:0.7 }}>Interactive visualizations powered by Chart.js</Typography>
      </Paper>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb:4 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderRadius:2, bgcolor:'#f3f4f6' }}>
            <CardContent>
              <Typography>📧 Total Classifications</Typography>
              <Typography variant="h4" sx={{ fontWeight:700 }}>{predictions.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderRadius:2, bgcolor:'#f3f4f6' }}>
            <CardContent>
              <Typography>⚠️ Spam Detected</Typography>
              <Typography variant="h4" sx={{ fontWeight:700 }}>{spamCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderRadius:2, bgcolor:'#f3f4f6' }}>
            <CardContent>
              <Typography>📈 Avg Confidence</Typography>
              <Typography variant="h4" sx={{ fontWeight:700 }}>{avgConfidence.toFixed(1)}%</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Chart Toggle */}
      <Box sx={{ mb:3, textAlign:'center' }}>
        <ButtonGroup variant="outlined">
          {['all','distribution','trend','performance'].map(type => (
            <Button
              key={type}
              onClick={()=>setSelectedChart(type)}
              variant={selectedChart===type?'contained':'outlined'}
            >{type.charAt(0).toUpperCase()+type.slice(1)}</Button>
          ))}
        </ButtonGroup>
      </Box>

      {/* Charts */}
      <Grid container spacing={3}>
        {(selectedChart==='all' || selectedChart==='distribution') && (
          <>
            <Grid item xs={12} md={6}>
              <Paper elevation={3} sx={{ p:3, borderRadius:3 }}>
                <Box sx={{ display:'flex', justifyContent:'space-between', mb:2 }}>
                  <Typography variant="h6" sx={{ fontWeight:600 }}>Spam vs Ham</Typography>
                  <Tooltip title="Export Chart">
                    <IconButton onClick={()=>exportChart(chartRefs.donut,'spam_distribution')}><DownloadIcon/></IconButton>
                  </Tooltip>
                </Box>
                <Box sx={{ height:300 }}><Pie ref={chartRefs.donut} data={donutData} options={donutOptions} /></Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper elevation={3} sx={{ p:3, borderRadius:3 }}>
                <Box sx={{ display:'flex', justifyContent:'space-between', mb:2 }}>
                  <Typography variant="h6" sx={{ fontWeight:600 }}>Confidence Histogram</Typography>
                  <Tooltip title="Export Chart">
                    <IconButton onClick={()=>exportChart(chartRefs.histogram,'confidence_histogram')}><DownloadIcon/></IconButton>
                  </Tooltip>
                </Box>
                <Box sx={{ height:300 }}><Bar ref={chartRefs.histogram} data={histogramData} options={histogramOptions} /></Box>
              </Paper>
            </Grid>
          </>
        )}

        {(selectedChart==='all' || selectedChart==='trend') && (
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p:3, borderRadius:3 }}>
              <Box sx={{ display:'flex', justifyContent:'space-between', mb:2 }}>
                <Typography variant="h6" sx={{ fontWeight:600 }}>Confidence Timeline</Typography>
                <Tooltip title="Export Chart">
                  <IconButton onClick={()=>exportChart(chartRefs.timeline,'confidence_timeline')}><DownloadIcon/></IconButton>
                </Tooltip>
              </Box>
              <Box sx={{ height:300 }}><Line ref={chartRefs.timeline} data={timelineData} options={timelineOptions} /></Box>
            </Paper>
          </Grid>
        )}

        {(selectedChart==='all' || selectedChart==='performance') && modelInfo && (
          <>
            <Grid item xs={12} md={6}>
              <Paper elevation={3} sx={{ p:3, borderRadius:3 }}>
                <Typography variant="h6" sx={{ fontWeight:600 }}>Confusion Matrix</Typography>
                <Box sx={{ height:300, mt:2 }}>
                  <Bar ref={chartRefs.confusion} data={confusionMatrixData} options={confusionOptions}/>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper elevation={3} sx={{ p:3, borderRadius:3 }}>
                <Typography variant="h6" sx={{ fontWeight:600 }}>Performance Metrics</Typography>
                <Box sx={{ height:300, mt:2 }}>
                  <Bar ref={chartRefs.metrics} data={metricsData} options={metricsOptions}/>
                </Box>
              </Paper>
            </Grid>
          </>
        )}
      </Grid>
    </Box>
  );
}

export default Charts;
