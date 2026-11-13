import sharp from 'sharp';
import { mkdir, writeFile, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const root = 'public/assets/astronaut-eyes/v2';
const gazeSource = '/home/rio/.codex/generated_images/01a1d47f-f5d9-7e71-a66d-fabcc8262aa8/exec-36e1b4ee-32c9-4f0c-a6ef-1edb0d8532d0.png';
const blinkSource = '/home/rio/.codex/generated_images/01a1d47f-f5d9-7e71-a66d-fabcc8262aa8/exec-04ecb6b3-d495-42b7-9d98-86e9122e128d.png';
await mkdir(`${root}/gaze`, { recursive: true });
await mkdir(`${root}/blink`, { recursive: true });
await copyFile(gazeSource, `${root}/sources/gaze.png`);
await copyFile(blinkSource, `${root}/sources/blink.png`);

// Inspected source: six columns, seven rows, 209px column pitch and
// 183px row pitch. The last row is truncated at source, so use a shared
// 200x150 portrait crop that fits every row without borrowing adjacent pixels.
const frames = [];
const hashes = new Set();
for (let row = 0; row < 7; row++) {
  for (let col = 0; col < 6; col++) {
    const id = row * 6 + col;
    const file = `gaze/gaze-${String(id).padStart(3, '0')}.png`;
    const buffer = await sharp(gazeSource).extract({ left: col * 209 + 4, top: row * 183 + 3, width: 200, height: 150 }).png().toBuffer();
    hashes.add(createHash('sha256').update(buffer).digest('hex'));
    await writeFile(`${root}/${file}`, buffer);
    frames.push({ file, kind: 'gaze', index: id, row, column: col, targetX: col / 5 * 2 - 1, targetY: row / 3 - 1 });
  }
}
for (let id = 0; id < 25; id++) {
  const row = Math.floor(id / 5), col = id % 5;
  const left = Math.round(col * 1254 / 5), top = Math.round(row * 1254 / 5);
  const right = Math.round((col + 1) * 1254 / 5), bottom = Math.round((row + 1) * 1254 / 5);
  const tile = await sharp(blinkSource).extract({ left, top, width: right - left, height: bottom - top }).resize(209, 209).png().toBuffer();
  const buffer = await sharp(tile).extract({ left: 4, top: 3, width: 200, height: 150 }).png().toBuffer();
  const file = `blink/blink-${String(id).padStart(3, '0')}.png`;
  hashes.add(createHash('sha256').update(buffer).digest('hex'));
  await writeFile(`${root}/${file}`, buffer);
  frames.push({ file, kind: 'blink', index: id });
}
await writeFile(`${root}/manifest.json`, JSON.stringify({ version: 2, width: 200, height: 150, gazeColumns: 6, gazeRows: 7, gazeCount: 42, blinkCount: 25, total: frames.length, uniqueFiles: hashes.size, baseUrl: '/assets/astronaut-eyes/v2/', note: 'Generated frames. Gaze coordinates are intended grid positions, not measured eyeball rotations. Not motion-captured; minor registration and gaze variations remain.', frames }, null, 2));
await writeFile(`${root}/README.md`, '# Individual astronaut eye frames\n\n67 separate PNG images: 42 gaze frames and 25 blink frames. Every image is 200 × 150 pixels, without upscaling. Generated using the built-in image tool, then extracted with Sharp into individual files as requested. No duplicate files or artificial count inflation.\n\nThe gaze source returned six columns rather than the requested seven. Actual source boundaries were used, with a shared crop excluding the truncated bottom edge. Blink tiles are scaled down to the same face scale and cropped to the same output dimensions. Source sheets are retained in sources/.\n\nGaze files are row-major, top to bottom, viewer-left to viewer-right. Blink files run from open through closed to open. manifest.json lists every file. Intended gaze coordinates are approximate; the generator does not guarantee perfectly uniform eye rotations or pixel-identical face anatomy. These are prototype assets, not a verified production-quality motion capture sequence.\n\nSee generation-prompts.txt for the complete prompts.\n');
console.log(JSON.stringify({ frames: frames.length, uniqueFiles: hashes.size, width: 200, height: 150 }));
