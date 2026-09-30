// Avatar en pixel art : il gagne des accessoires à chaque rang.
const BASE = [
  "................",
  "......hhhh......",
  ".....hhhhhh.....",
  ".....ssssss.....",
  ".....sesses.....",
  ".....ssssss.....",
  "....bbbbbbbb....",
  "...sbbbbbbbbs...",
  "...sbbbbbbbbs...",
  "...sbbbbbbbbs...",
  "....bbbbbbbb....",
  "....ll....ll....",
  "....ll....ll....",
  "....ll....ll....",
  "...kkk....kkk...",
  "................",
];

// Modifications cumulatives, une liste par rang (rang 0 = Recrue, aucune)
const RANK_OPS: [number, number, string][][] = [
  [],
  [[10, 4, "yyyyyyyy"]],
  [[2, 5, "rrrrrr"], [4, 14, "m"], [5, 14, "m"], [6, 14, "m"], [7, 14, "m"], [8, 14, "m"], [9, 14, "y"], [10, 14, "y"]],
  [[1, 5, "aaaaaa"], [2, 5, "aaaaaa"], [6, 0, "aaa"], [7, 0, "aaa"], [8, 0, "aaa"], [9, 0, "aaa"], [10, 0, "aaa"]],
  [[6, 4, "bbaaaabb"], [7, 4, "baaaaaab"], [8, 4, "bbaaaabb"], [0, 6, "gggg"], [7, 7, "gg"]],
  [[6, 2, "aa"], [6, 12, "aa"], [7, 2, "aa"], [7, 12, "aa"], [11, 3, "c"], [12, 3, "c"], [13, 3, "c"], [11, 12, "c"], [12, 12, "c"], [13, 12, "c"]],
  [[0, 2, "y"], [2, 1, "y"], [5, 0, "y"], [9, 1, "y"], [12, 0, "y"], [1, 13, "y"], [4, 15, "y"], [9, 14, "y"], [7, 6, "yyyy"], [8, 6, "yyyy"], [0, 6, "gggg"]],
];

const COL: Record<string, string> = {
  h: "#6b4a2b", s: "#f0c7a0", e: "#1a2040", b: "#2f8a5b", l: "#3a4a8a", k: "#4a3324",
  y: "#ffc65a", r: "#c4451a", m: "#c9d3e8", a: "#8f9bbd", g: "#ffd76a", c: "#7b3fa0",
};

export function avatarSvg(rankIndex: number, label = "Avatar"): string {
  const grid = BASE.map((r) => r.split(""));
  for (let k = 0; k <= Math.min(rankIndex, RANK_OPS.length - 1); k++) {
    for (const [row, col, s] of RANK_OPS[k]) {
      for (let i = 0; i < s.length; i++) if (col + i < 16) grid[row][col + i] = s[i];
    }
  }
  let rects = "";
  grid.forEach((row, y) => row.forEach((c, x) => {
    if (c !== ".") rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${COL[c]}"/>`;
  }));
  return `<svg class="avatar" viewBox="0 0 16 16" shape-rendering="crispEdges" role="img" aria-label="${label}">${rects}</svg>`;
}
