// Converte WOFF (v1) em TTF/OTF — o react-pdf lida mal com alguns WOFF.
// Uso: node scripts/woff-to-ttf.mjs <ficheiros.woff...>
import { readFileSync, writeFileSync } from "node:fs";
import { inflateSync } from "node:zlib";

for (const file of process.argv.slice(2)) {
  const w = readFileSync(file);
  if (w.toString("ascii", 0, 4) !== "wOFF") throw new Error(`${file} não é WOFF`);
  const flavor = w.readUInt32BE(4);
  const numTables = w.readUInt16BE(12);
  const tables = [];
  for (let i = 0; i < numTables; i++) {
    const o = 44 + i * 20;
    const tag = w.toString("ascii", o, o + 4);
    const offset = w.readUInt32BE(o + 4);
    const compLength = w.readUInt32BE(o + 8);
    const origLength = w.readUInt32BE(o + 12);
    const checksum = w.readUInt32BE(o + 16);
    const raw = w.subarray(offset, offset + compLength);
    const data = compLength < origLength ? inflateSync(raw) : raw;
    tables.push({ tag, checksum, data });
  }
  tables.sort((a, b) => (a.tag < b.tag ? -1 : 1));
  let es = 0;
  while (1 << (es + 1) <= numTables) es++;
  const searchRange = (1 << es) * 16;
  const header = Buffer.alloc(12 + numTables * 16);
  header.writeUInt32BE(flavor, 0);
  header.writeUInt16BE(numTables, 4);
  header.writeUInt16BE(searchRange, 6);
  header.writeUInt16BE(es, 8);
  header.writeUInt16BE(numTables * 16 - searchRange, 10);
  let offset = header.length;
  const chunks = [header];
  tables.forEach((t, i) => {
    const r = 12 + i * 16;
    header.write(t.tag, r, "ascii");
    header.writeUInt32BE(t.checksum, r + 4);
    header.writeUInt32BE(offset, r + 8);
    header.writeUInt32BE(t.data.length, r + 12);
    const pad = (4 - (t.data.length % 4)) % 4;
    chunks.push(t.data, Buffer.alloc(pad));
    offset += t.data.length + pad;
  });
  const out = file.replace(/\.woff$/, flavor === 0x4f54544f ? ".otf" : ".ttf");
  writeFileSync(out, Buffer.concat(chunks));
  console.log(out);
}
