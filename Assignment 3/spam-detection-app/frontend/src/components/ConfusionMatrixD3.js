import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

function ConfusionMatrixD3({ data, width = 300, height = 300 }) {
  const ref = useRef();

  useEffect(() => {
    if (!data) return;

    const margin = { top: 40, right: 20, bottom: 40, left: 60 };
    const svgWidth = width;
    const svgHeight = height;
    const chartWidth = svgWidth - margin.left - margin.right;
    const chartHeight = svgHeight - margin.top - margin.bottom;

    const svg = d3.select(ref.current);
    svg.selectAll('*').remove(); // Clear previous render

    const chart = svg
      .attr('width', svgWidth)
      .attr('height', svgHeight)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xLabels = ['Ham (Pred)', 'Spam (Pred)'];
    const yLabels = ['Ham (Actual)', 'Spam (Actual)'];

    const maxVal = d3.max(data, d => d.v);

    const x = d3.scaleBand().domain(xLabels).range([0, chartWidth]).padding(0.1);
    const y = d3.scaleBand().domain(yLabels).range([0, chartHeight]).padding(0.1);
    const color = d3.scaleLinear().domain([0, maxVal]).range(['#bbdefb', '#1565c0']);

    // Tooltip
    const tooltip = d3.select('body')
      .append('div')
      .style('position', 'absolute')
      .style('padding', '6px 10px')
      .style('background', '#333')
      .style('color', '#fff')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('opacity', 0);

    // Draw cells
    chart.selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', d => x(xLabels[d.x]))
      .attr('y', d => y(yLabels[d.y]))
      .attr('width', x.bandwidth())
      .attr('height', y.bandwidth())
      .attr('fill', d => color(d.v))
      .on('mouseover', (event, d) => {
        tooltip.transition().duration(200).style('opacity', 0.9);
        tooltip.html(`Count: ${d.v}`)
          .style('left', event.pageX + 10 + 'px')
          .style('top', event.pageY - 28 + 'px');
      })
      .on('mouseout', () => {
        tooltip.transition().duration(200).style('opacity', 0);
      });

    // Add value labels
    chart.selectAll('text.label')
      .data(data)
      .enter()
      .append('text')
      .attr('x', d => x(xLabels[d.x]) + x.bandwidth() / 2)
      .attr('y', d => y(yLabels[d.y]) + y.bandwidth() / 2)
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'middle')
      .attr('fill', 'white')
      .style('font-size', '14px')
      .text(d => d.v);

    // X Axis
    chart.append('g')
      .attr('transform', `translate(0, 0)`)
      .call(d3.axisTop(x))
      .selectAll('text')
      .attr('fill', 'white');

    // Y Axis
    chart.append('g')
      .call(d3.axisLeft(y))
      .selectAll('text')
      .attr('fill', 'white');

    // Legend
    const legendWidth = 100;
    const legendHeight = 10;
    const legendMargin = { top: chartHeight + 30, left: 0 };
    const legendData = d3.range(0, maxVal + 1);

    const legendScale = d3.scaleLinear().domain([0, maxVal]).range([0, legendWidth]);
    const legendAxis = d3.axisBottom(legendScale).ticks(3).tickSize(4).tickFormat(d3.format('d'));

    const legend = chart.append('g')
      .attr('transform', `translate(${legendMargin.left},${legendMargin.top})`);

    legend.selectAll('rect')
      .data(legendData)
      .enter()
      .append('rect')
      .attr('x', d => legendScale(d))
      .attr('y', 0)
      .attr('width', legendWidth / legendData.length)
      .attr('height', legendHeight)
      .attr('fill', d => color(d));

    legend.append('g')
      .attr('transform', `translate(0, ${legendHeight})`)
      .call(legendAxis)
      .selectAll('text')
      .attr('fill', 'white');

    return () => tooltip.remove(); // Cleanup tooltip on unmount
  }, [data, width, height]);

  return <svg ref={ref} style={{ backgroundColor: '#1e3a5f' }} />;
}

export default ConfusionMatrixD3;
