import React, { useState, useRef } from 'react';
import {
  Card, CardContent, Typography, Box, Button, ButtonGroup, IconButton
} from '@mui/material';
import { Download as DownloadIcon, Assessment as AssessmentIcon } from '@mui/icons-material';
import { Grid2 as Grid } from '@mui/material';
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

import BoxPlotD3 from './D3BoxPlot';
import ConfusionMatrixD3 from './ConfusionMatrixD3';

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


// Reusable Chart Card
function ChartCard({ title, children, height = 300, onDownload }) {
  return (
    <Card sx={{ bgcolor: '#1e3a5f', color: 'white', p: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{title}</Typography>
          {onDownload && (
            <IconButton onClick={onDownload} sx={{ color: 'white' }} size="small">
              <DownloadIcon />
            </IconButton>
          )}
        </Box>
        <Box sx={{ height, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {children}
        </Box>
      </CardContent>
    </Card>
  );
}

// Main Charts Component
function Charts({ predictions }) {
  const [chartFilter, setChartFilter] = useState('all');

  const pieChartRef = useRef(null);
  const confidenceChartRef = useRef(null);
  const spamWordChartRef = useRef(null);
  const hamWordChartRef = useRef(null);
  const performanceChartRef = useRef(null);

  const modelInfo = {
    TN: 30374,
    FP: 4717,
    FN: 2055,
    TP: 34166,
    precision_ham: 0.94,
    precision_spam: 0.89,
    recall_ham: 0.94,
    recall_spam: 0.93,
    f1_ham: 0.94,
    f1_spam: 0.91
  };

  if (predictions.length === 0) return null;

 
  // Chart Data
  const spamCount = predictions.filter(p => p.prediction === 'Spam').length;
  const hamCount = predictions.filter(p => p.prediction === 'Ham').length;

  const pieData = {
    labels: ['Spam', 'Ham'],
    datasets: [{
      data: [spamCount, hamCount],
      backgroundColor: ['#f44336', '#4caf50'],
      borderColor: '#fff',
      borderWidth: 2
    }]
  };

  const lastTen = predictions.slice(-10);
  const confidenceLineData = {
    labels: lastTen.map((_, i) => `Email ${predictions.length - 9 + i}`),
    datasets: [
      {
        label: 'Spam Confidence',
        data: lastTen.map(p => p.prediction === 'Spam' ? p.confidence_percentage : null),
        borderColor: '#f44336',
        backgroundColor: '#f4433640',
        fill: true,
        tension: 0.3,
        pointRadius: 5
      },
      {
        label: 'Ham Confidence',
        data: lastTen.map(p => p.prediction === 'Ham' ? p.confidence_percentage : null),
        borderColor: '#4caf50',
        backgroundColor: '#4caf5040',
        fill: true,
        tension: 0.3,
        pointRadius: 5
      }
    ]
  };
  const confidenceLineOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: 'white' } } }, scales: { x: { ticks: { color: 'white' } }, y: { ticks: { color: 'white' } } } };

  const extractTopWords = (preds, type, topN = 10) => {
    const filtered = preds.filter(p => p.prediction === type);
    const stopwords = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','with','is','was','are','be','been','have','has','had','do','does','did','will','would','should','could','may','might','can','this','that','these','those','i','you','he','she','it','we','they','what','which','who','when','where','why','how','from','by','about','as','into','through','during','before','after','above','below','up','down','out','off','over','under','hey','hello','hi']);
    const freq = {};
    filtered.forEach(p => {
      const text = p.text || p.email_text || '';
      text.toLowerCase()
        .replace(/[^a-z\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3 && !stopwords.has(w))
        .forEach(w => freq[w] = (freq[w] || 0) + 1);
    });
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([word, count]) => ({ word, count }));
  };

  const spamWords = extractTopWords(predictions, 'Spam');
  const hamWords = extractTopWords(predictions, 'Ham');

  const spamWordsData = { labels: spamWords.map(w => w.word), datasets: [{ label: 'Frequency', data: spamWords.map(w => w.count), backgroundColor: '#f4433680', borderColor: '#f44336', borderWidth: 2 }] };
  const hamWordsData = { labels: hamWords.map(w => w.word), datasets: [{ label: 'Frequency', data: hamWords.map(w => w.count), backgroundColor: '#4caf5080', borderColor: '#4caf50', borderWidth: 2 }] };

  const performanceData = modelInfo ? {
    labels: ['Precision (Ham)', 'Precision (Spam)', 'Recall (Ham)', 'Recall (Spam)', 'F1 (Ham)', 'F1 (Spam)'],
    datasets: [{
      label: 'Metrics (%)',
      data: [
        modelInfo.precision_ham * 100,
        modelInfo.precision_spam * 100,
        modelInfo.recall_ham * 100,
        modelInfo.recall_spam * 100,
        modelInfo.f1_ham * 100,
        modelInfo.f1_spam * 100
      ],
      backgroundColor: ['#1976d2', '#1565c0', '#0d47a1', '#42a5f5', '#64b5f6', '#90caf9'],
      borderColor: '#1565c0',
      borderWidth: 2
    }]
  } : null;

  const performanceOptions = {
    indexAxis: 'y',
    responsive: true,
    plugins: { legend: { labels: { color: 'white' } } },
    scales: {
      x: { beginAtZero: true, max: 100, ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.1)' } },
      y: { ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.1)' } }
    }
  };

  // Render
  return (
    <Box sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssessmentIcon /> Classification Results & Analytics
        </Typography>
        <Button variant="contained" startIcon={<DownloadIcon />} sx={{ bgcolor: '#1976d2' }}>
          Export Data (CSV)
        </Button>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <ButtonGroup variant="contained" size="large">
          {['all', 'distribution', 'performance'].map(filter => (
            <Button
              key={filter}
              onClick={() => setChartFilter(filter)}
              sx={{
                bgcolor: chartFilter === filter ? '#1e3a5f' : 'white',
                color: chartFilter === filter ? 'white' : '#1e3a5f',
                fontWeight: 'bold',
                px: 4,
                '&:hover': { bgcolor: chartFilter === filter ? '#2d4a6e' : '#e3f2fd' }
              }}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Button>
          ))}
        </ButtonGroup>
      </Box>

      <Grid container spacing={3}>
        {(chartFilter === 'all' || chartFilter === 'distribution') && (
          <>
            <Grid item xs={12} md={6}>
              <ChartCard title="Spam vs Ham Distribution" chartRef={pieChartRef} height={300}>
                <Pie ref={pieChartRef} data={pieData} options={{ responsive: true, maintainAspectRatio: false }} />
              </ChartCard>
            </Grid>

            <Grid item xs={12} md={6}>
              <ChartCard title="Classification Confidence Levels" chartRef={confidenceChartRef} height={300}>
                <Line ref={confidenceChartRef} data={confidenceLineData} options={confidenceLineOptions} />
              </ChartCard>
            </Grid>

            <Grid item xs={12}>
              <ChartCard title="Top 10 Common Words in Spam Emails" chartRef={spamWordChartRef} height={300}>
                <Bar ref={spamWordChartRef} data={spamWordsData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: 'white' } } },  scales: { x: { ticks: { color: 'white' } }, y: { ticks: { color: 'white' } } } } } />
              </ChartCard>
            </Grid>

            <Grid item xs={12}>
              <ChartCard title="Top 10 Common Words in Ham Emails" chartRef={hamWordChartRef} height={300}>
                <Bar ref={hamWordChartRef} data={hamWordsData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: 'white' } } }, scales: { x: { ticks: { color: 'white' } }, y: { ticks: { color: 'white' } } } } } />
              </ChartCard>
            </Grid>

            <Grid item xs={12} md={6}>
              <ChartCard
                title="Confidence Distribution Box Plot"
                height={450}
              >
                <Box sx={{ 
                  height: 450, 
                  bgcolor: '#2a2a2a', 
                  borderRadius: 1,
                  p: 2,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <BoxPlotD3
                    data={predictions.map(p => p.confidence_percentage)}
                    title="Confidence Distribution"
                  />
                </Box>

                {/* Statistics Display Below */}
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr 1fr', 
                  gap: 1.5, 
                  mt: 2 
                }}>
                  {(() => {
                    const confData = predictions.map(p => p.confidence_percentage).sort((a, b) => a - b);
                    const n = confData.length;
                    const stats = {
                      min: confData[0],
                      q1: confData[Math.floor(n * 0.25)],
                      median: confData[Math.floor(n * 0.5)],
                      mean: confData.reduce((a, b) => a + b) / n,
                      q3: confData[Math.floor(n * 0.75)],
                      max: confData[n - 1]
                    };

                    return (
                      <>
                        <Box sx={{ p: 1.5, bgcolor: '#1e1e1e', borderRadius: 1, border: '1px solid #f44336' }}>
                          <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#f44336' }}>
                            Minimum
                          </Typography>
                          <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                            {stats.min.toFixed(2)}%
                          </Typography>
                        </Box>

                        <Box sx={{ p: 1.5, bgcolor: '#1e1e1e', borderRadius: 1, border: '1px solid #ff9800' }}>
                          <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
                            Q1 (25th Percentile)
                          </Typography>
                          <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                            {stats.q1.toFixed(2)}%
                          </Typography>
                        </Box>

                        <Box sx={{ p: 1.5, bgcolor: '#1e1e1e', borderRadius: 1, border: '1px solid #2196f3' }}>
                          <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#2196f3' }}>
                            Median
                          </Typography>
                          <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                            {stats.median.toFixed(2)}%
                          </Typography>
                        </Box>

                        <Box sx={{ p: 1.5, bgcolor: '#1e1e1e', borderRadius: 1, border: '1px solid #1976d2' }}>
                          <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                            Mean
                          </Typography>
                          <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                            {stats.mean.toFixed(2)}%
                          </Typography>
                        </Box>

                        <Box sx={{ p: 1.5, bgcolor: '#1e1e1e', borderRadius: 1, border: '1px solid #4caf50' }}>
                          <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                            Q3 (75th Percentile)
                          </Typography>
                          <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                            {stats.q3.toFixed(2)}%
                          </Typography>
                        </Box>

                        <Box sx={{ p: 1.5, bgcolor: '#1e1e1e', borderRadius: 1, border: '1px solid #4caf50' }}>
                          <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                            Maximum
                          </Typography>
                          <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                            {stats.max.toFixed(2)}%
                          </Typography>
                        </Box>
                      </>
                    );
                  })()}
                </Box>
              </ChartCard>
            </Grid>
          </>
        )}

        {(chartFilter === 'all' || chartFilter === 'performance') && modelInfo && (
          <>
            <Grid item xs={12} md={6}>
              <ChartCard title="Linear SVM Model Performance" chartRef={performanceChartRef} height={300}>
                <Bar ref={performanceChartRef} data={performanceData} options={performanceOptions} />
              </ChartCard>
            </Grid>

            <Grid item xs={12} md={6}>
              <ChartCard title="Confusion Matrix (Heatmap)" height={300}>
                <ConfusionMatrixD3
                  data={[
                    { x: 0, y: 0, v: modelInfo.TN },
                    { x: 1, y: 0, v: modelInfo.FP },
                    { x: 0, y: 1, v: modelInfo.FN },
                    { x: 1, y: 1, v: modelInfo.TP }
                  ]}
                  width={300}
                  height={300}
                />
              </ChartCard>
            </Grid>
          </>
        )}
      </Grid>
    </Box>
  );
}

export default Charts;
