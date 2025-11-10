import React from 'react';
import {
  Paper, Typography, Card, CardContent, Box, LinearProgress
} from '@mui/material';
import {
  BarChart as BarChartIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { Grid2 as Grid } from '@mui/material';

function Statistics({ statistics }) {
  if (!statistics || !statistics.statistics) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1" color="text.secondary">
          No statistics available yet.
        </Typography>
      </Paper>
    );
  }

  const stats = statistics.statistics;
  const metadata = statistics.metadata || {};

  const StatCard = ({ icon: Icon, title, value, subtitle, color = 'primary' }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              bgcolor: `${color}.light`,
              p: 1.5,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon sx={{ color: `${color}.main`, fontSize: 32}} />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
            <Typography color="text.secondary" variant="body2" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h5" component="div">
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Aggregate Statistics & Analytics
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={BarChartIcon}
            title="Total Classifications"
            value={stats.total_predictions}
            color="primary"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={WarningIcon}
            title="Spam Detected"
            value={stats.spam_count}
            subtitle={`${stats.spam_percentage}% of total`}
            color="error"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={CheckCircleIcon}
            title="Legitimate Emails"
            value={stats.ham_count}
            subtitle={`${stats.ham_percentage}% of total`}
            color="success"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={TrendingUpIcon}
            title="Avg. Confidence"
            value={`${stats.average_confidence}%`}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Detailed Metrics */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
          Detailed Metrics
        </Typography>

        <Grid container spacing={3}>
          {/* Confidence Metrics */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Confidence Range
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Average</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {stats.average_confidence}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={stats.average_confidence}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Maximum</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {stats.max_confidence}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={stats.max_confidence}
                  sx={{ height: 8, borderRadius: 4, bgcolor: 'success.light' }}
                />
              </Box>

              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Minimum</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {stats.min_confidence}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={stats.min_confidence}
                  sx={{ height: 8, borderRadius: 4, bgcolor: 'warning.light' }}
                />
              </Box>
            </Box>
          </Grid>

          {/* Metadata */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Database Information
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2" color="text.secondary">
                  Created
                </Typography>
                <Typography variant="body2">
                  {metadata.created_at ? new Date(metadata.created_at).toLocaleString() : 'Unknown'}
                </Typography>
              </Box>

              <Box sx={{ py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2" color="text.secondary">
                  Last Updated
                </Typography>
                <Typography variant="body2">
                  {metadata.last_updated ? new Date(metadata.last_updated).toLocaleString() : 'Never'}
                </Typography>
              </Box>

              <Box sx={{ py: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Database Version
                </Typography>
                <Typography variant="body2">
                  {metadata.version || 'Unknown'}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}

export default Statistics;
