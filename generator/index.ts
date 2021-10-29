import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import * as dayjs from 'dayjs';
import { join } from 'path';
import { renderReport } from './renderReport';

const path = join(process.cwd(), 'static');
if (!existsSync(path)) {
  mkdirSync(path);
}

type Office = 'Berlin' | 'Munich' | 'Stuttgart' | 'Helsinki' | 'Tampere';

type Sorted = {
  [date: string]: {
    [office: string]: Set<string>;
  };
};

console.log('Reading dataset');
const data = readFileSync(join(__dirname, 'registrations.csv'), {
  encoding: 'utf-8',
})
  .split(/\n/g)
  .filter(x => x !== '')
  .map(line => {
    const l = line.split(/,/g);
    return {
      name: l[0],
      office: l[1] as Office,
      date: l[2],
    };
  })
  .sort((a, b) => a.date.localeCompare(b.date));

let sorted: Sorted = {};
for (const d of data) {
  let x = sorted[d.date];
  if (!x) {
    x = {};
    sorted[d.date] = x;
  }

  let y: Set<string> = x[d.office];
  if (!y) {
    y = new Set<string>();
    x[d.office] = y;
  }
  y.add(d.name);
}

console.log('Running data aggregation');
let dates = [data[0].date];
for (const { date } of data) {
  let last = dates[dates.length - 1];
  if (date === last) continue;

  let lastDate = dayjs(last + 'T00:00:00.000Z');
  const newDate = dayjs(date + 'T00:00:00.000Z');
  while (lastDate.isBefore(newDate)) {
    lastDate = lastDate.add(1, 'day');
    dates.push(lastDate.format('YYYY-MM-DD'));
  }
}

let connections = {};
for (let i = 0; i < dates.length; i++) {
  const date = dates[i];
  const lastData = connections[dates[i - 1]];
  let x = sorted[date];
  if (!x) {
    if (lastData) connections[date] = lastData;
    continue;
  }

  let result = lastData ? JSON.parse(JSON.stringify(lastData)) : {};

  for (const [office, people] of Object.entries(x)) {
    let z = result[office];
    if (!z) {
      z = {};
    }

    for (const p1 of people.keys()) {
      for (const p2 of people.keys()) {
        if (p1.localeCompare(p2) >= 0) continue;

        let w = z[p1];
        if (!w) {
          w = {};
          z[p1] = w;
        }

        w[p2] = w[p2] ? w[p2] + 1 : 1;
      }
    }

    if (Object.keys(z).length > 0) {
      result[office] = z;
    }
  }

  if (Object.keys(result).length > 0) {
    connections[date] = result;
  }
}

const people = data
  .map(x => x.name)
  .reduce((acc, curr) => acc.add(curr), new Set<string>());

renderReport(people.size, data.length, Object.keys(sorted).length);

pairsBars();
forceGraph(
  ['Helsinki', 'Tampere', 'Munich', 'Berlin', 'Stuttgart'],
  'force_graph.json'
);
forceGraph(
  ['Munich', 'Berlin', 'Stuttgart'],
  'force_graph_germany.json',
  false
);
forceGraph(['Helsinki', 'Tampere'], 'force_graph_finland.json', false);

function forceGraph(offices: string[], filename: string, all = true) {
  const data = connections[dates[dates.length - 1]];
  let ids = new Set<number>();
  const mapping = [...people.keys()].reduce((acc, curr) => {
    let id: number | undefined;
    while (ids.has((id = Math.ceil(Math.random() * 10000)))) {}
    ids.add(id);
    acc.set(curr, id);
    return acc;
  }, new Map<string, number>());

  const nodes = new Set<number>();

  let newData = {};
  for (const [office, x] of Object.entries(data)) {
    if (offices.indexOf(office) === -1) continue;
    for (const [p1, p2s] of Object.entries(x)) {
      const pp1 = mapping.get(p1);
      let y = newData[pp1] ?? {};
      newData[pp1] = y;
      for (const [p2, n] of Object.entries(p2s)) {
        const pp2 = mapping.get(p2);
        let obj = newData[pp1][pp2] ?? {};
        newData[pp1][pp2] = obj;
        nodes.add(pp1);
        nodes.add(pp2);
        obj[office] = n;
      }
    }
  }

  const result = {
    nodes: all ? [...mapping.values()] : [...nodes.keys()],
    edges: newData,
  };

  console.log('Writing data for ' + filename);
  writeFileSync(join(path, filename), JSON.stringify(result), {
    encoding: 'utf-8',
  });
}

function pairsBars() {
  let histogram = {};

  for (const [date, x] of Object.entries(connections)) {
    histogram[date] = {};
    let maxConnections = 0;
    let maxNumConnections = 0;

    for (const [office, y] of Object.entries(x)) {
      histogram[date][office] = {};
      let a = histogram[date][office];
      let b = 0;

      for (const [_, p2s] of Object.entries(y)) {
        for (const [_, n] of Object.entries(p2s)) {
          a[n] = a[n] ? a[n] + 1 : 1;
          if (n > maxConnections) {
            maxConnections = n;
          }
          if (a[n] > b) {
            b = a[n];
          }
        }
      }

      maxNumConnections += b;
    }
    histogram[date].maxX = maxConnections;
    histogram[date].maxY = maxNumConnections;
  }

  console.log('Writing data for pairs_bars');
  writeFileSync(join(path, 'pairs_bars.json'), JSON.stringify(histogram), {
    encoding: 'utf-8',
  });
}
