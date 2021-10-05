import * as marked from "marked";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { width, height, margin } from "../page/settings";

const maxWidth = width + margin.left + margin.right + 20;

export function renderReport(): void {
  const mkDocument = (content: string) =>
    `<!DOCTYPE html>
<html>
  <head>
    <title>Force diagram</title>
    <style>
      .bar {
        fill: steelblue;
      }
      svg text {
        font-size: 0.8rem;
      }
      * {
        font-family: sans-serif;
      }
      main {
        width: ${maxWidth}px;
      }
    </style>
  </head>
  <body>
    <main>
      ${content}
    </main>
    <script type="module" src="./page/pairs_bars.ts"></script>
  </body>
</html>`;

  const markdown = readFileSync(join(process.cwd(), "report.md"), {
    encoding: "utf-8",
  });

  const rendered = mkDocument(marked(markdown)).replace(
    /"><\/svg>/,
    `" width="${width + margin.left + margin.right}" height="${
      height + margin.top + margin.bottom
    }"></svg>`
  );

  console.log("Writing index.html");
  writeFileSync(join(process.cwd(), "index.html"), rendered, {
    encoding: "utf-8",
  });
}
