import { readFile, writeFile } from "node:fs/promises";
const count = 1025;
const header = Buffer.alloc(8);
header.write("PKG1");
header.writeUInt32BE(count, 4);
const records = await Promise.all(
  Array.from({ length: count }, async (_, index) => {
    const id = index + 1;
    const image = await readFile(
      new URL(`../public/sprites/${id}.png`, import.meta.url),
    );
    const record = Buffer.alloc(8);
    record.writeUInt32BE(id);
    record.writeUInt32BE(image.length, 4);
    return Buffer.concat([record, image]);
  }),
);
const pack = Buffer.concat([header, ...records]);
await writeFile(new URL("../public/sprites.pack", import.meta.url), pack);
console.log(
  `Packed ${count} sprites into ${(pack.length / 1024).toFixed(0)} KiB.`,
);
