import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { renderReport } from './renderReport';

renderReport();

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

let connections = {};
for (const [date, x] of Object.entries(sorted)) {
  for (const [office, s] of Object.entries(x)) {
    let tmpConnections: { [x: string]: Set<string> } = {};

    for (const p1 of s.keys()) {
      for (const p2 of s.keys()) {
        if (p1 === p2) continue;

        let [x, y] = p1.localeCompare(p2) < 0 ? [p1, p2] : [p2, p1];
        let z = tmpConnections[x];
        if (!z) {
          z = new Set<string>();
          tmpConnections[x] = z;
        }
        z.add(y);
      }
    }

    for (const [p1, p2s] of Object.entries(tmpConnections)) {
      let x = connections[p1];
      if (!x) {
        x = {};
        connections[p1] = x;
      }

      for (const p2 of p2s.keys()) {
        if (!x[p2]) {
          x[p2] = 0;
        }
        x[p2]++;
      }
    }
  }
}

let connectionsHist = {};
let numConnections = 0;

let maxConnections = 0;
for (const [_, p2s] of Object.entries(connections)) {
  for (const [_, x] of Object.entries(p2s)) {
    if (x > maxConnections) {
      maxConnections = x;
    }

    if (!connectionsHist[x]) {
      connectionsHist[x] = 0;
    }
    connectionsHist[x]++;
    numConnections++;
  }
}

console.log('numConnections', numConnections);
console.log('maxConnections', maxConnections);

const people = data
  .map(x => x.name)
  .reduce((acc, curr) => acc.add(curr), new Set<string>());

console.log('numPeople', people.size);
console.log('numDates', Object.keys(sorted).length);

writePairsBar(connectionsHist);

function writePairsBar(data: { [x: number]: number }): void {
  const str =
    'x,y\n' +
    Object.entries(data)
      .map(([x, y]) => `${x},${y}`)
      .join('\n');

  console.log('writing data for pairs_bars');
  writeFileSync(join(path, 'pairs_bars.csv'), str, { encoding: 'utf-8' });
}
