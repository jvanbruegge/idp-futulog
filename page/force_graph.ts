import {
  select,
  scaleSymlog,
  forceCenter,
  forceSimulation,
  forceLink,
  forceManyBody,
  SimulationNodeDatum,
  SimulationLinkDatum,
  forceX,
  forceY,
} from 'd3';
import { margin, width, height } from './settings';

fetch('./force_graph.json')
  .then(res => res.json())
  .then(data => draw(data, offices));
fetch('./force_graph_germany.json')
  .then(res => res.json())
  .then(data => draw(data, ['Munich', 'Berlin', 'Stuttgart'], '_germany', 10));
fetch('./force_graph_finland.json')
  .then(res => res.json())
  .then(data => draw(data, ['Helsinki', 'Tampere'], '_finland', 6));

type Datum = {
  Munich?: number;
  Berlin?: number;
  Stuttgart?: number;
  Helsinki?: number;
  Tampere?: number;
};

type Data = {
  nodes: number[];
  edges: {
    [p1: number]: {
      [p2: number]: Datum;
    };
  };
};

type Office = 'Munich' | 'Berlin' | 'Stuttgart' | 'Helsinki' | 'Tampere';
const offices: Office[] = [
  'Munich',
  'Berlin',
  'Stuttgart',
  'Helsinki',
  'Tampere',
];

interface Node extends SimulationNodeDatum {
  id: number;
}
interface Edge extends SimulationLinkDatum<Node> {
  d: Datum;
}

function draw(
  data: Data,
  offices: Office[],
  suffix: string = '',
  distance = 3
): Promise<void> {
  return new Promise(resolve => {
    if (suffix) {
      document.querySelector(`#force_graph${suffix}_text`)!.textContent =
        'Simulation running, please wait until the graph is properly layouted';
    }

    const nodes: Node[] = data.nodes.map(x => ({ id: x }));

    let links: Edge[] = [];
    for (const [p1, p2s] of Object.entries(data.edges)) {
      for (const [p2, obj] of Object.entries(p2s)) {
        links.push({
          source: parseInt(p1),
          target: parseInt(p2),
          d: obj,
        });
      }
    }

    const linkScale = scaleSymlog().domain([150, 1]).range([0.5, 5]);

    const getDistance = (d: Datum) => distance;
    /*(d.Munich ?? 0) +
    (d.Berlin ?? 0) +
    (d.Stuttgart ?? 0) +
    (d.Helsinki ?? 0) +
    (d.Tampere ?? 0);*/

    const linkForce = forceLink<Node, Edge>(links)
      .id(d => d.id)
      .distance(d => linkScale(getDistance(d.d)));

    const border = 20;

    const simulation = forceSimulation(nodes)
      .force('link', linkForce)
      .force('charge', forceManyBody())
      .force('center', forceCenter(width / 2, height / 2))
      .force(
        'x',
        forceX(width / 2).strength(d =>
          d.x >= width - border || d.x <= border ? 1 : 0.01
        )
      )
      .force(
        'y',
        forceY(height / 2).strength(d =>
          d.y >= height - border || d.y <= border ? 1 : 0.01
        )
      );

    const svg = select('#force_graph' + suffix).attr('viewBox', [
      0,
      0,
      width,
      height,
    ] as any);

    const getColor = (d: Datum) => {
      let max = 0;
      let office = '';
      for (const o of offices) {
        if ((d[o] ?? 0) > max) {
          max = d[o];
          office = o;
        }
      }

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
    };

    const link = svg
      .append('g')
      .attr('stroke-opacity', 0.4)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', 0.25)
      .attr('stroke', d => getColor(d.d));

    const node = svg
      .append('g')
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', 2)
      .attr('fill', 'red');

    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as Node).x)
        .attr('y1', d => (d.source as Node).y)
        .attr('x2', d => (d.target as Node).x)
        .attr('y2', d => (d.target as Node).y);

      node.attr('cx', d => d.x).attr('cy', d => d.y);
    });

    simulation.on('end', () => {
      document.querySelector(`#force_graph${suffix}_text`)!.textContent =
        'Simulation finished';
    });

    setTimeout(() => {
      simulation.stop();
      document.querySelector(`#force_graph${suffix}_text`)!.textContent =
        'Simulation finished';
      resolve();
    }, 90000);
  });
}
