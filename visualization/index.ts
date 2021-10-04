import { forceSimulation } from "d3-force";
import {
  select,
  scaleLinear,
  scaleSymlog,
  max,
  axisBottom,
  axisLeft,
} from "d3";

type Office = "Berlin" | "Munich" | "Stuttgart" | "Helsinki" | "Tampere";

type RawData = Array<{
  name: string;
  office: Office;
  date: string;
}>;

type Sorted = {
  [date: string]: {
    [office: string]: Set<string>;
  };
};

const margin = { top: 10, right: 30, bottom: 50, left: 60 };
const width = 900 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;


async function run() {
  const rawData = await (await fetch("./registrations.csv")).text();

  const data: RawData = rawData
    .split(/\n/g)
    .filter((x) => x !== "")
    .map((line) => {
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

  console.log(connectionsHist);
  console.log("numConnections", numConnections);

  console.log(maxConnections);

  console.log(connections);

  const people = data
    .map((x) => x.name)
    .reduce((acc, curr) => acc.add(curr), new Set<string>());

  console.log(people.size);
  console.log(Object.keys(sorted).length);

  console.log(sorted);
  console.log(forceSimulation);

  renderHistogram(connectionsHist);
}

function renderHistogram(data1: { [x: number]: number }) {
  const data = Object.entries(data1).map(([x, y]) => [parseInt(x), y]);

  const svg = select("#viz")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = scaleLinear()
    .domain([1, max(data, (x) => x[0])])
    .range([0, width]);

  svg
    .append("g")
    .attr("transform", `translate(0, ${height})`)
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
        max(data, (d) => d[0]),
      ])
    );

  svg.append('text')
    .attr('transform', `translate(${width / 2}, ${height + margin.bottom - 15})`)
    .style('text-anchor', 'middle')
    .text('# of times a unique pair has met in the office');

  const y = scaleSymlog()
    .domain([0, max(data, (x) => x[1])])
    .range([height, 0]);

  svg.append("g").call(
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
        max(data, (d) => d[1]),
      ])
      .tickSizeInner(-width - 5)
      .tickSizeOuter(3)
  );

  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', 0 - margin.left)
    .attr('x', 0 - (height / 2))
    .attr('dy', '1em')
    .style('text-anchor', 'middle')
    .text('# of unique pairs that met x times in the office');

  svg
    .selectAll(".bar")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", (d) => x(d[0]))
    .attr("y", (d) => y(d[1]))
    .attr("width", width / data.length - 5)
    .attr("height", (d) => height - y(d[1]));
}

run();
