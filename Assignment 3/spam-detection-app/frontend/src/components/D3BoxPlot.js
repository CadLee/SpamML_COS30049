import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Box } from '@mui/material';

function D3BoxPlot({ data, title = "Confidence Distribution Box Plot" }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    // --- Compute statistics ---
    const sorted = [...data].sort((a, b) => a - b);
    const n = sorted.length;
    const min = sorted[0];
    const q1 = sorted[Math.floor(n * 0.25)];
    const median = sorted[Math.floor(n * 0.5)];
    const q3 = sorted[Math.floor(n * 0.75)];
    const max = sorted[n - 1];
    const mean = data.reduce((a, b) => a + b) / n;

    // Add 10% padding above/below for visual breathing room
    const padding = (max - min) * 0.1;
    const scaledMin = Math.max(0, min - padding);
    const scaledMax = Math.min(100, max + padding);

    // --- Dimensions ---
    const margin = { top: 30, right: 150, bottom: 40, left: 80 };
    const width = 500 - margin.left - margin.right;
    const height = 450 - margin.top - margin.bottom;

    // --- Reset SVG ---
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .style('background-color', '#1e1e1eff');

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // --- Scales ---
    const yScale = d3.scaleLinear()
      .domain([scaledMin, scaledMax])
      .range([height, 0]);

    const xScale = d3.scaleBand()
      .domain(['Confidence'])
      .range([0, width / 3])
      .padding(0.5);

    const whiskerWidth = xScale.bandwidth() * 0.6;
    const centerX = xScale('Confidence') + xScale.bandwidth() / 2;

    // --- Draw whiskers and box ---
    g.append('line').attr('x1', centerX).attr('x2', centerX)
      .attr('y1', yScale(min)).attr('y2', yScale(q1))
      .attr('stroke', '#1976d2').attr('stroke-width', 3);

    g.append('line').attr('x1', centerX).attr('x2', centerX)
      .attr('y1', yScale(q3)).attr('y2', yScale(max))
      .attr('stroke', '#1976d2').attr('stroke-width', 3);

    g.append('line').attr('x1', centerX - whiskerWidth / 2)
      .attr('x2', centerX + whiskerWidth / 2)
      .attr('y1', yScale(min)).attr('y2', yScale(min))
      .attr('stroke', '#1976d2').attr('stroke-width', 2);

    g.append('line').attr('x1', centerX - whiskerWidth / 2)
      .attr('x2', centerX + whiskerWidth / 2)
      .attr('y1', yScale(max)).attr('y2', yScale(max))
      .attr('stroke', '#1976d2').attr('stroke-width', 2);

    g.append('rect')
      .attr('x', centerX - whiskerWidth / 2)
      .attr('y', yScale(q3))
      .attr('width', whiskerWidth)
      .attr('height', yScale(q1) - yScale(q3))
      .attr('fill', '#1976d280')
      .attr('stroke', '#1976d2')
      .attr('stroke-width', 2);

    g.append('line')
      .attr('x1', centerX - whiskerWidth / 2)
      .attr('x2', centerX + whiskerWidth / 2)
      .attr('y1', yScale(median))
      .attr('y2', yScale(median))
      .attr('stroke', '#ff9800')
      .attr('stroke-width', 3);

    g.append('circle')
      .attr('cx', centerX)
      .attr('cy', yScale(mean))
      .attr('r', 5)
      .attr('fill', '#4caf50')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // --- Axes ---
    const yAxis = d3.axisLeft(yScale).ticks(8).tickFormat(d => `${d.toFixed(1)}%`);
    g.append('g').call(yAxis).style('color', '#fff');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left + 10)
      .attr('x', 0 - height / 2)
      .attr('fill', '#fff')
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text('Confidence (%)');

    g.append('text')
      .attr('x', width / 6)
      .attr('y', height + margin.bottom - 5)
      .attr('fill', '#fff')
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text('All Predictions');

    // --- Stats labels with smart offset ---
    const stats = [
      { label: 'Min', value: min, color: '#f44336' },
      { label: 'Q1', value: q1, color: '#ff9800' },
      { label: 'Median', value: median, color: '#2196f3' },
      { label: 'Mean', value: mean, color: '#2196f3' },
      { label: 'Q3', value: q3, color: '#4caf50' },
      { label: 'Max', value: max, color: '#4caf50' }
    ];

    // Sort and space out labels
    stats.sort((a, b) => yScale(b.value) - yScale(a.value));
    const minSpacing = 16; // pixels
    stats[0].adjustedY = yScale(stats[0].value);

    for (let i = 1; i < stats.length; i++) {
      const prevY = stats[i - 1].adjustedY;
      const currentY = yScale(stats[i].value);
      stats[i].adjustedY = Math.min(prevY - minSpacing, currentY);
    }

    const statsX = centerX + whiskerWidth + 40;

    // Draw connector lines and text
    g.selectAll('.stat-line')
      .data(stats)
      .enter()
      .append('line')
      .attr('x1', centerX + whiskerWidth / 2)
      .attr('x2', statsX - 10)
      .attr('y1', d => yScale(d.value))
      .attr('y2', d => d.adjustedY)
      .attr('stroke', d => d.color)
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4');

    g.selectAll('.stat-text')
      .data(stats)
      .enter()
      .append('text')
      .attr('x', statsX)
      .attr('y', d => d.adjustedY + 4)
      .attr('fill', d => d.color)
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text(d => `${d.label}: ${d.value.toFixed(2)}%`);
  }, [data]);

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg ref={svgRef} style={{ width: '100%', height: 'auto' }}></svg>
    </Box>
  );
}

export default D3BoxPlot;
