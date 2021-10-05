import {
  select,
  scaleLinear,
  scaleSymlog,
  max,
  axisBottom,
  axisLeft,
  csv,
} from 'd3';
import { margin, width, height } from './settings';

csv('/pairs_bars.csv', (d: any) => ({
  x: parseInt(d.x),
  y: parseInt(d.y),
})).then(renderHistogram);

function renderHistogram(data: Array<{ x: number; y: number }>) {
  const svg = select('#pairs_bars')
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const x = scaleLinear()
    .domain([1, max(data, d => d.x)])
    .range([0, width]);

  svg
    .append('g')
    .attr('transform', `translate(0, ${height})`)
    .call(
      axisBottom(x).tickValues([
        1,
        10,
        20,
        30,
        40,
        50,
        60,
        70,
        80,
        90,
        100,
        110,
        120,
        130,
        max(data, d => d.x),
      ])
    );

  svg
    .append('text')
    .attr(
      'transform',
      `translate(${width / 2}, ${height + margin.bottom - 15})`
    )
    .style('text-anchor', 'middle')
    .text('# of times a unique pair has met in the office');

  const y = scaleSymlog()
    .domain([0, max(data, x => x.y)])
    .range([height, 0]);

  svg.append('g').call(
    axisLeft(y)
      .tickValues([
        0,
        1,
        2,
        5,
        10,
        20,
        50,
        100,
        200,
        500,
        1000,
        2000,
        5000,
        max(data, d => d.y),
      ])
      .tickSizeInner(-width - 5)
      .tickSizeOuter(3)
  );

  svg
    .append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', 0 - margin.left)
    .attr('x', 0 - height / 2)
    .attr('dy', '1em')
    .style('text-anchor', 'middle')
    .text('# of unique pairs that met x times in the office');

  svg
    .selectAll('.bar')
    .data(data)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('x', d => x(d.x))
    .attr('y', d => y(d.y))
    .attr('width', width / data.length - 5)
    .attr('height', d => height - y(d.y));
}
