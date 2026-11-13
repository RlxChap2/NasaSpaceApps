# Individual astronaut eye frames

67 separate PNG images: 42 gaze frames and 25 blink frames. Every image is 200 × 150 pixels, without upscaling. Generated using the built-in image tool, then extracted with Sharp into individual files as requested. No duplicate files or artificial count inflation.

The gaze source returned six columns rather than the requested seven. Actual source boundaries were used, with a shared crop excluding the truncated bottom edge. Blink tiles are scaled down to the same face scale and cropped to the same output dimensions. Source sheets are retained in sources/.

Gaze files are row-major, top to bottom, viewer-left to viewer-right. Blink files run from open through closed to open. manifest.json lists every file. Intended gaze coordinates are approximate; the generator does not guarantee perfectly uniform eye rotations or pixel-identical face anatomy. These are prototype assets, not a verified production-quality motion capture sequence.

See generation-prompts.txt for the complete prompts.
