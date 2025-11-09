import React, { useState, useEffect, useRef } from 'react';
import {
  Card, CardContent, Typography, Box, Button, ButtonGroup, IconButton
} from '@mui/material';
import { Download as DownloadIcon, Assessment as AssessmentIcon } from '@mui/icons-material';
import { Grid2 as Grid } from '@mui/material';
import { Pie, Bar, Line, Chart as ReactChart } from 'react-chartjs-2';
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
import { MatrixController, MatrixElement } from 'chartjs-chart-matrix';
import { BoxPlot } from 'chartjs-chart-box-and-violin-plot';
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
  Legend,
  MatrixController,
  MatrixElement,
  BoxPlotController, 
  BoxAndWhiskers
);

// ====================
// Reusable Chart Card
// ====================
function ChartCard({ title, chartRef, children, height = 300, onDownload }) {
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

// ====================
// Main Charts Component
// ====================
function Charts({ predictions }) {
  const [modelInfo, setModelInfo] = useState(null);
  const [chartFilter, setChartFilter] = useState('all');

  const pieChartRef = useRef(null);
  const confidenceChartRef = useRef(null);
  const spamWordChartRef = useRef(null);
  const hamWordChartRef = useRef(null);
  const boxPlotRef = useRef(null);
  const performanceChartRef = useRef(null);
  const confusionMatrixRef = useRef(null);

  useEffect(() => {
    axios.get('http://localhost:8000/model-info')
      .then(res => setModelInfo(res.data))
      .catch(err => console.error(err));
  }, []);

  if (predictions.length === 0) return null;

  // ====================
  // Chart Data
  // ====================
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
  const confidenceLineOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: 'white' } } } };

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

  const boxData = {
    labels: ['Confidence'],
    datasets: [{
      label: 'Confidence',
      data: [predictions.map(p => p.confidence_percentage)],
      backgroundColor: '#1976d2',
      borderColor: '#fff',
      borderWidth: 2
    }]
  };

  const boxOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: 'white' } } } };

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

  const confusionData = modelInfo ? {
    datasets: [{
      label: 'Confusion Matrix',
      data: [
        { x: 0, y: 0, v: modelInfo.TN },
        { x: 1, y: 0, v: modelInfo.FP },
        { x: 0, y: 1, v: modelInfo.FN },
        { x: 1, y: 1, v: modelInfo.TP }
      ],
      backgroundColor: ctx => {
        const val = ctx.dataset.data[ctx.dataIndex].v;
        const max = Math.max(modelInfo.TN, modelInfo.FP, modelInfo.FN, modelInfo.TP);
        return `rgba(33, 150, 243, ${val / max})`;
      },
      width: ({ chart }) => (chart.chartArea?.width || 0) / 2 - 10,
      height: ({ chart }) => (chart.chartArea?.height || 0) / 2 - 10
    }]
  } : null;

  const confusionOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => `Count: ${ctx.raw.v}` } }
    },
    scales: {
      x: { type: 'category', labels: ['Ham (Pred)', 'Spam (Pred)'], offset: true, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: 'white' } },
      y: { type: 'category', labels: ['Ham (Actual)', 'Spam (Actual)'], offset: true, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: 'white' } }
    }
  };

  // ====================
  // Render
  // ====================
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
                <Bar ref={spamWordChartRef} data={spamWordsData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: 'white' } } } }} />
              </ChartCard>
            </Grid>

            <Grid item xs={12}>
              <ChartCard title="Top 10 Common Words in Ham Emails" chartRef={hamWordChartRef} height={300}>
                <Bar ref={hamWordChartRef} data={hamWordsData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: 'white' } } } }} />
              </ChartCard>
            </Grid>

            <Grid item xs={12} md={6}>
              <ChartCard title="Confidence Statistics (Box Plot)" chartRef={boxPlotRef} height={300}>
                <ReactChart ref={boxPlotRef} type="boxplot" data={boxData} options={boxOptions} />
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
              <ChartCard title="Confusion Matrix (Heatmap)" chartRef={confusionMatrixRef} height={300}>
                <ReactChart
                  ref={confusionMatrixRef}
                  type="matrix"
                  data={{
                    datasets: [{
                      label: 'Confusion Matrix',
                      data: [
                        { x: 0, y: 0, v: modelInfo.TN },
                        { x: 1, y: 0, v: modelInfo.FP },
                        { x: 0, y: 1, v: modelInfo.FN },
                        { x: 1, y: 1, v: modelInfo.TP }
                      ],
                      backgroundColor: ctx => {
                        const max = Math.max(modelInfo.TN, modelInfo.FP, modelInfo.FN, modelInfo.TP);
                        return `rgba(33, 150, 243, ${ctx.dataset.data[ctx.dataIndex].v / max})`;
                      },
                      width: ({ chart }) => ((chart.chartArea?.width || 0) / 2 - 10),
                      height: ({ chart }) => ((chart.chartArea?.height || 0) / 2 - 10)
                    }]
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { display: false },
                      tooltip: { callbacks: { label: ctx => `Count: ${ctx.raw.v}` } }
                    },
                    scales: {
                      x: { type: 'category', labels: ['Ham (Pred)', 'Spam (Pred)'], offset: true, ticks: { color: 'white' } },
                      y: { type: 'category', labels: ['Ham (Actual)', 'Spam (Actual)'], offset: true, ticks: { color: 'white' } }
                    }
                  }}
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
