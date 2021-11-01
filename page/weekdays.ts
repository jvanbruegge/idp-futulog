import { select, scaleOrdinal, scaleLinear, axisBottom, axisLeft } from 'd3';
import * as dayjs from 'dayjs';
import { width, height, margin } from './settings';

type Day = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
type Office = 'Munich' | 'Berlin' | 'Stuttgart' | 'Helsinki' | 'Tampere';

type Mode = 'Average' | 'Median' | 'Maximum';

type Data = {
  [k in Day]: {
    [o in Office]: number[];
  } & { dates: string[] };
} & { maxY: number; dates: string[] };

fetch('./weekdays.json')
  .then(res => res.json())
  .then(init);

const days: Day[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const offices: Office[] = [
  'Munich',
  'Berlin',
  'Stuttgart',
  'Helsinki',
  'Tampere',
];

function init(data: Data) {
  const render = makeRenderWeekdays(data);

  const dates = data.dates;
  const n = dates.length - 1;

  const span = document.querySelector('#weekdays_value')!;

  const slider = document.querySelector('#weekdays_date')! as HTMLInputElement;
  slider.min = '0';
  slider.max = `${n}`;
  slider.value = `${n}`;

  span.textContent = dates[n];

  slider.addEventListener('input', ev => {
    const date = dates[parseInt((ev.target as HTMLInputElement).value)];
    span.textContent = date;
    render(date);
  });

  offices.forEach(o => {
    const x = document.querySelector(`#weekdays_${o}`)! as HTMLInputElement;
    x.addEventListener('input', () => {
      const date = dates[parseInt(slider.value)];
      span.textContent = date;
      render(date);
    });
  });

  document.querySelectorAll('input[name="mode"]').forEach(el => {
    el.addEventListener('input', () => {
      const date = dates[parseInt(slider.value)];
      span.textContent = date;
      render(date);
    });
  });

  const button = document.querySelector('#weekdays_play')! as HTMLInputElement;
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
        render(dates[next]);
      }, 50);
      button.textContent = 'Pause';
    }
  });

  render(dates[n]);
}

function makeRenderWeekdays(data: Data): (date: string) => void {
  return date => {
    const offices = getOffices();
    const mode = getMode();
    const top = select('#weekdays');
    top.selectChildren().remove();

    const svg = top
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = scaleOrdinal()
      .domain(['', ...days])
      .range(
        [0, 1, 2, 3, 4, 5].map(i =>
          i === 0 ? 0 : ((width - width / 12) / 5) * (i - 1) + width / 12
        )
      );

    const y = scaleLinear().domain([0, data.maxY]).range([height, 0]);

    svg
      .append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(axisBottom(x as any).ticks(5));

    let ticksY = [];
    for (let i = 0; i < data.maxY; i += 10) {
      ticksY.push(i);
    }
    ticksY.push(data.maxY);

    svg.append('g').call(
      axisLeft(y)
        .tickValues(ticksY)
        .tickSizeInner(-width - 5)
        .tickSizeOuter(3)
    );

    const barWidth = (width - width / 12) / 10;

    let arr = [];
    for (const day of days) {
      let currentHeight = 0;
      for (const office of offices) {
        const n = calculate(data, date, day, office, mode);
        arr.push({
          x: (x(day) as number) - barWidth / 2,
          y: y(n) - currentHeight,
          width: barWidth,
          height: height - y(n),
          color: getColor(office),
        });
        currentHeight += height - y(n);
      }
    }

    svg
      .append('g')
      .selectAll('.bar')
      .data(arr)
      .enter()
      .append('rect')
      .attr('x', d => d.x)
      .attr('y', d => d.y)
      .attr('width', d => d.width)
      .attr('height', d => d.height)
      .style('fill', d => d.color);
  };
}

function getColor(office: Office): string {
  switch (office) {
    case 'Helsinki':
      return 'steelblue';
    case 'Tampere':
      return 'green';
    case 'Munich':
      return 'red';
    case 'Berlin':
      return 'gray';
    case 'Stuttgart':
      return '#9400d3';
  }
}

function calculate(
  data: Data,
  date: string,
  day: Day,
  office: Office,
  mode: Mode
): number {
  const d = data[day];
  const end = dayjs(date);

  let values = [];

  for (let i = 0; i < d.dates.length; i++) {
    const date = dayjs(d.dates[i]);
    if (date.isBefore(end)) {
      values.push(d[office][i]);
    } else break;
  }

  values.sort();

  switch (mode) {
    case 'Average':
      return values.reduce((a, c) => a + c, 0) / values.length;
    case 'Median':
      return values[Math.floor(values.length / 2)];
    case 'Maximum':
      return values.reduce((a, c) => (c > a ? c : a), 0);
  }
}

function getOffices(): Office[] {
  return offices.reduce((acc, o) => {
    const x = document.querySelector(`#weekdays_${o}`)! as HTMLInputElement;
    if (x.checked) {
      acc.push(o);
    }
    return acc;
  }, [] as Office[]);
}

function getMode(): Mode {
  const val = (
    document.querySelector('input[name="mode"]:checked')! as HTMLInputElement
  ).value;
  return val as Mode;
}
