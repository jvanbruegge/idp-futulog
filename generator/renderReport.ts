import { Remarkable } from 'remarkable';
const toc = require('markdown-toc');
const { remarkablePluginHeadingId } = require('remarkable-plugin-heading-id');
import hljs from 'highlight.js';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { width, height, margin } from '../page/settings';

hljs.configure({
  classPrefix: '',
});

const md = new Remarkable({
  html: true,
  highlight: (str, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(lang, str).value;
      } catch (err) {}
    }

    try {
      return hljs.highlightAuto(str).value;
    } catch (err) {}

    return '';
  },
}).use(remarkablePluginHeadingId, {
  createId: (_: number, str: string) => str.toLowerCase(),
});

const maxWidth = width + margin.left + margin.right + 20;

export function renderReport(
  numPeople: number,
  numRegistrations: number,
  numDays: number
): void {
  const mkDocument = (content: string) =>
    `<!DOCTYPE html>
<html>
  <head>
    <title>Project report: futuLog</title>
    <style>
      svg text {
        font-size: 0.8rem;
      }
      * {
        font-family: sans-serif;
      }
      main {
        width: ${maxWidth}px;
        margin: 0 auto;
      }
      h1 {
        text-align: center;
      }
      p {
        text-align: justify;
      }
      img, iframe {
        width: 90%;
        margin: 1em auto;
        display: block;
        border: 1px solid gray;
      }
    </style>
    <link rel="stylesheet" href="./css/highlight.css">
  </head>
  <body>
    <main>
      ${content}
    </main>
    <script type="module" src="./page/pairs_bars.ts"></script>
    <script type="module" src="./page/force_graph.ts"></script>
    <script type="module" src="./page/weekdays.ts"></script>
  </body>
</html>`;

  const markdown = readFileSync(join(process.cwd(), 'report.md'), {
    encoding: 'utf-8',
  })
    .replace(/\$\$numPeople\$\$/g, `${numPeople}`)
    .replace(/\$\$numRegistrations\$\$/g, `${numRegistrations}`)
    .replace(/\$\$numDays\$\$/g, `${numDays}`);

  const rendered = mkDocument(
    md.render(
      toc.insert(markdown, {
        //bullets: '1.',
      })
    )
  ).replace(
    /"><\/svg>/g,
    `" width="${width + margin.left + margin.right}" height="${
      height + margin.top + margin.bottom
    }"></svg>`
  );

  console.log('Writing index.html');
  writeFileSync(join(process.cwd(), 'index.html'), rendered, {
    encoding: 'utf-8',
  });
}
