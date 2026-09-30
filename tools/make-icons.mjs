// Génère les icônes PWA (pixel art : un "P" vert sur fond sombre).
import zlib from "node:zlib";
import fs from "node:fs";

const G = [
  "................",
  "................",
  "..PPPPPPPP......",
  "..PPPPPPPPPP....",
  "..PP......PPP...",
  "..PP......PPP...",
  "..PP......PPP...",
  "..PPPPPPPPPP....",
  "..PPPPPPPP......",
  "..PP............",
  "..PP............",
  "..PP............",
  "................",
  ".GGGGGGGGGGGG...",
  ".GGGGGGGGGGGG...",
  "................",
];
const BG = [0x12, 0x16, 0x29], FG = [0x7c, 0xe2, 0xa1], BAR = [0xff, 0xc6, 0x5a];

const crcT = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (b) => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };

function png(size) {
  const cell = Math.floor(size / 16), off = Math.floor((size - cell * 16) / 2);
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const gx = Math.floor((x - off) / cell), gy = Math.floor((y - off) / cell);
      const ch = gx >= 0 && gx < 16 && gy >= 0 && gy < 16 ? G[gy][gx] : ".";
      const col = ch === "P" ? FG : ch === "G" ? BAR : BG;
      raw.set(col, y * (size * 3 + 1) + 1 + x * 3);
    }
  }
  const ih = Buffer.alloc(13); ih.writeUInt32BE(size, 0); ih.writeUInt32BE(size, 4); ih[8] = 8; ih[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ih), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

for (const [name, s] of [["apple-touch-icon.png", 180], ["icon-192.png", 192], ["icon-512.png", 512]]) fs.writeFileSync(`public/${name}`, png(s));
