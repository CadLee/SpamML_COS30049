import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Box} from '@mui/material';

function D3BoxPlot({ data, title = "Confidence Distribution Box Plot" }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Calculate statistics
    const sorted = [...data].sort((a, b) => a - b);
    const n = sorted.length;
    const min = sorted[0];
    const q1 = sorted[Math.floor(n * 0.25)];
    const median = sorted[Math.floor(n * 0.5)];
    const q3 = sorted[Math.floor(n * 0.75)];
    const max = sorted[n - 1];
    const mean = data.reduce((a, b) => a + b) / n;
    //const iqr = q3 - q1;

    // Calculate padding for better visualization
    // Add 5% padding above max and below min for spacing
    const padding = (max - min) * 0.1;
    const scaledMin = Math.max(0, min - padding);
    const scaledMax = Math.min(100, max + padding);

    // Define margins and dimensions
    const margin = { top: 30, right: 150, bottom: 40, left: 80 };
    const width = 500 - margin.left - margin.right;
    const height = 450 - margin.top - margin.bottom;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .style('background-color', '#1e1e1e');

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scales - KEY CHANGE: Use scaled domain instead of [0, 100]
    const yScale = d3.scaleLinear()
      .domain([scaledMin, scaledMax])  // Closer to min/max values
      .range([height, 0]);

    const xScale = d3.scaleBand()
      .domain(['Confidence'])
      .range([0, width / 3])
      .padding(0.5);

    // Draw whiskers (min to max)
    const whiskerWidth = xScale.bandwidth() * 0.6;
    const centerX = xScale('Confidence') + xScale.bandwidth() / 2;

    // Lower whisker line
    g.append('line')
      .attr('x1', centerX)
      .attr('y1', yScale(min))
      .attr('x2', centerX)
      .attr('y2', yScale(q1))
      .attr('stroke', '#1976d2')
      .attr('stroke-width', 3);

    // Upper whisker line
    g.append('line')
      .attr('x1', centerX)
      .attr('y1', yScale(q3))
      .attr('x2', centerX)
      .attr('y2', yScale(max))
      .attr('stroke', '#1976d2')
      .attr('stroke-width', 3);

    // Lower whisker cap
    g.append('line')
      .attr('x1', centerX - whiskerWidth / 2)
      .attr('y1', yScale(min))
      .attr('x2', centerX + whiskerWidth / 2)
      .attr('y2', yScale(min))
      .attr('stroke', '#1976d2')
      .attr('stroke-width', 2);

    // Upper whisker cap
    g.append('line')
      .attr('x1', centerX - whiskerWidth / 2)
      .attr('y1', yScale(max))
      .attr('x2', centerX + whiskerWidth / 2)
      .attr('y2', yScale(max))
      .attr('stroke', '#1976d2')
      .attr('stroke-width', 2);

    // Draw box (Q1 to Q3)
    g.append('rect')
      .attr('x', centerX - whiskerWidth / 2)
      .attr('y', yScale(q3))
      .attr('width', whiskerWidth)
      .attr('height', yScale(q1) - yScale(q3))
      .attr('fill', '#1976d280')
      .attr('stroke', '#1976d2')
      .attr('stroke-width', 2);

    // Draw median line
    g.append('line')
      .attr('x1', centerX - whiskerWidth / 2)
      .attr('y1', yScale(median))
      .attr('x2', centerX + whiskerWidth / 2)
      .attr('y2', yScale(median))
      .attr('stroke', '#ff9800')
      .attr('stroke-width', 3);

    // Draw mean point
    g.append('circle')
      .attr('cx', centerX)
      .attr('cy', yScale(mean))
      .attr('r', 5)
      .attr('fill', '#4caf50')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Add Y-axis with dynamic ticks
    const yAxis = d3.axisLeft(yScale)
      .ticks(8)
      .tickFormat(d => `${d.toFixed(1)}%`);

    g.append('g')
      .attr('class', 'y-axis')
      .call(yAxis)
      .style('color', '#fff')
      .select('.domain')
      .attr('stroke', '#666');

    g.selectAll('.y-axis .tick line')
      .attr('stroke', '#666')
      .attr('stroke-width', 1);

    g.selectAll('.y-axis text')
      .attr('fill', '#fff')
      .attr('font-size', '12px');

    // Add Y-axis label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (height / 2))
      .attr('dy', '1em')
      .attr('fill', '#fff')
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text('Confidence (%)');

    // Add X-axis label
    g.append('text')
      .attr('x', width / 6)
      .attr('y', height + margin.bottom - 5)
      .attr('fill', '#fff')
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text('All Predictions');

    // Add statistics labels with better positioning
    const statsX = centerX + whiskerWidth + 40;

    // Min label with connector line
    g.append('line')
      .attr('x1', centerX + whiskerWidth / 2)
      .attr('y1', yScale(min))
      .attr('x2', statsX - 10)
      .attr('y2', yScale(min))
      .attr('stroke', '#f44336')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4');

    g.append('text')
      .attr('x', statsX)
      .attr('y', yScale(min) + 4)
      .attr('fill', '#f44336')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text(`Min: ${min.toFixed(2)}%`);

    // Q1 label with connector line
    g.append('line')
      .attr('x1', centerX + whiskerWidth / 2)
      .attr('y1', yScale(q1))
      .attr('x2', statsX - 10)
      .attr('y2', yScale(q1))
      .attr('stroke', '#ff9800')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4');

    g.append('text')
      .attr('x', statsX)
      .attr('y', yScale(q1) + 4)
      .attr('fill', '#ff9800')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text(`Q1: ${q1.toFixed(2)}%`);

    // Median label with connector line
    g.append('line')
      .attr('x1', centerX + whiskerWidth / 2)
      .attr('y1', yScale(median))
      .attr('x2', statsX - 10)
      .attr('y2', yScale(median))
      .attr('stroke', '#0084ffff')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4');

    g.append('text')
      .attr('x', statsX)
      .attr('y', yScale(median) + 4)
      .attr('fill', '#0084ffff')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text(`Median: ${median.toFixed(2)}%`);

    // Mean label with connector line
    g.append('line')
      .attr('x1', centerX)
      .attr('y1', yScale(mean))
      .attr('x2', statsX - 10)
      .attr('y2', yScale(mean))
      .attr('stroke', '#0084ffff')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4');

    g.append('text')
      .attr('x', statsX)
      .attr('y', yScale(mean) + 4)
      .attr('fill', '#0084ffff')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text(`Mean: ${mean.toFixed(2)}%`);

    // Q3 label with connector line
    g.append('line')
      .attr('x1', centerX + whiskerWidth / 2)
      .attr('y1', yScale(q3))
      .attr('x2', statsX - 10)
      .attr('y2', yScale(q3))
      .attr('stroke', '#4caf50')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4');

    g.append('text')
      .attr('x', statsX)
      .attr('y', yScale(q3) + 4)
      .attr('fill', '#4caf50')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text(`Q3: ${q3.toFixed(2)}%`);

    // Max label with connector line
    g.append('line')
      .attr('x1', centerX + whiskerWidth / 2)
      .attr('y1', yScale(max))
      .attr('x2', statsX - 10)
      .attr('y2', yScale(max))
      .attr('stroke', '#4caf50')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4');

    g.append('text')
      .attr('x', statsX)
      .attr('y', yScale(max) + 4)
      .attr('fill', '#4caf50')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text(`Max: ${max.toFixed(2)}%`);

  }, [data]);

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg ref={svgRef} style={{ width: '100%', height: 'auto' }}></svg>
    </Box>
  );
}

export default D3BoxPlot;
