import {
  select,
  scaleLinear,
  scaleSymlog,
  max,
  axisBottom,
  axisLeft,
} from 'd3';
import { margin, width, height } from './settings';

fetch('./pairs_bars.json')
  .then(res => res.json())
  .then((data: Data) => renderHistogramDate(data['2021-10-05'], offices)); //TODO: Render all dates

type Data = {
  [date: string]: DataDate;
};

type DataDate = {
  Munich?: { [n: string]: number };
  Berlin?: { [n: string]: number };
  Stuttgart?: { [n: string]: number };
  Helsinki?: { [n: string]: number };
  Tampere?: { [n: string]: number };
  maxX: number;
  maxY: number;
};

type Office = 'Munich' | 'Berlin' | 'Stuttgart' | 'Helsinki' | 'Tampere';

const offices: Office[] = [
  'Munich',
  'Berlin',
  'Stuttgart',
  'Helsinki',
  'Tampere',
];

function renderHistogramDate(data: DataDate, offices: Office[]) {
  const top = select('#pairs_bars');
  top.selectChildren().remove();

  const svg = top
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const x = scaleLinear().domain([1, data.maxX]).range([0, width]);

  let ticksX = [1];
  for (let i = 10; i < data.maxX - 4; i += 10) {
    ticksX.push(i);
  }
  ticksX.push(data.maxX);

  svg
    .append('g')
    .attr('transform', `translate(0, ${height})`)
    .call(axisBottom(x).tickValues(ticksX));

  svg
    .append('text')
    .attr(
      'transform',
      `translate(${width / 2}, ${height + margin.bottom - 15})`
    )
    .style('text-anchor', 'middle')
    .text('# of times a unique pair has met in the office');

  const y = scaleSymlog().domain([0, data.maxY]).range([height, 0]);

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
        data.maxY,
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

  const barWidth = width / data.maxX - 2;

  let combined = {};

  for (const o of offices) {
    for (const [x, y] of Object.entries(data[o])) {
      combined[x] = (combined[x] ?? 0) + y;
    }
  }

  const arr = Object.entries(combined).map(([k, v]) => ({
    x: parseInt(k),
    y: v as number,
  }));

  svg
    .selectAll('.bar')
    .data(arr)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('x', d => x(d.x))
    .attr('y', d => y(d.y))
    .attr('width', barWidth)
    .attr('height', d => height - y(d.y));
}
