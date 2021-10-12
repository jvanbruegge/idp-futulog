import { select, scaleLinear, scaleSymlog, axisBottom, axisLeft } from 'd3';
import { margin, width, height } from './settings';

fetch('./pairs_bars.json')
  .then(res => res.json())
  .then(init);

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

function init(data: Data) {
  const dates = Object.keys(data);
  const n = dates.length - 1;

  const span = document.querySelector('#pairs_bars_value')!;

  const slider = document.querySelector(
    '#pairs_bars_date'
  )! as HTMLInputElement;
  slider.min = '0';
  slider.max = `${n}`;
  slider.value = `${n}`;

  span.textContent = dates[n];

  const last = data[dates[n]];
  const renderHistogram = makeRenderHistogram(data, last.maxX, last.maxY);

  slider.addEventListener('input', ev => {
    const date = dates[parseInt((ev.target as HTMLInputElement).value)];
    span.textContent = date;
    renderHistogram(date, offices);
  });

  const button = document.querySelector(
    '#pairs_bars_play'
  )! as HTMLInputElement;
  let isPlaying = undefined;
  button.addEventListener('click', () => {
    if (isPlaying) {
      clearInterval(isPlaying);
      button.textContent = 'Play';
      isPlaying = undefined;
    } else {
      isPlaying = setInterval(() => {
        const curr = parseInt(slider.value);
        const next = (curr + 1) % dates.length;
        if (next === n) {
          clearInterval(isPlaying);
          button.textContent = 'Play';
          isPlaying = undefined;
        }

        slider.value = `${next}`;
        span.textContent = dates[next];
        renderHistogram(dates[next], offices);
      }, 150);
      button.textContent = 'Pause';
    }
  });

  renderHistogram(dates[n], offices);
}

function makeRenderHistogram(
  data: Data,
  maxX: number,
  maxY: number
): (date: string, offices: Office[]) => void {
  return function renderHistogram(date: string, offices: Office[]) {
    const top = select('#pairs_bars');
    top.selectChildren().remove();

    const svg = top
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = scaleLinear().domain([1, maxX]).range([0, width]);

    let ticksX = [1];
    for (let i = 10; i < maxX - 4; i += 10) {
      ticksX.push(i);
    }
    ticksX.push(maxX);

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

    const y = scaleSymlog().domain([0, maxY]).range([height, 0]);

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
          maxY,
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

    const barWidth = width / maxX - 2;

    let combined = {};

    for (const o of offices) {
      if (!data[date][o]) continue;
      for (const [x, y] of Object.entries(data[date][o])) {
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
  };
}
