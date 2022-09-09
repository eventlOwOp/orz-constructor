const fs = require("fs").promises;
const GIFEncoder = require("gifencoder");
const iconv = require("iconv-lite");
const UPNG = require("./UPNG");
const path = require("path");
const { createCanvas, createImageData } = require("canvas");

async function getImg(text, size) {
	const fp = path.join(process.cwd(), "api", `HZK${size}`);
	fd = await fs.open(fp);
	function printBitmap(x) {
		for (let i = 0; i < size; ++i) {
			s = "";
			for (let j = 0; j < size; ++j) s += x[i][j];
			console.log(s);
		}
	}
	async function getBitmap(ch) {
		const code = iconv.encode(ch, "gbk");
		const area = code[0] - 0xa0;
		const index = code[1] - 0xa0;
		const offset = ((94 * (area - 1) + (index - 1)) * size * size) / 8;

		const bufsiz = (size * size) / 8;
		const buf = Buffer.alloc(bufsiz);
		await fd.read(buf, 0, bufsiz, offset);

		let bt = [];
		let p = 0;
		for (let i = 0; i < size; ++i) {
			let rw = [];
			for (let j = 0; j < size / 8; ++j, ++p)
				for (let k = 0; k < 8; ++k) rw.push((buf[p] >> (7 - k)) & 1);
			bt.push(rw);
		}
		return bt;
	}
	let bitmaps = [];
	for (let ch of text) bitmaps.push(await getBitmap(ch));
	fd.close();

	// for (let u of bitmaps) printBitmap(u);

	const fp0 = path.join(process.cwd(), "api", `0.png`);
	let img = UPNG.decode(await fs.readFile(fp0));
	const h = img.height;
	const w = img.width;
	let frs = UPNG.toRGBA8(img);

	const mw = w * size * text.length;
	const mh = h * size;

	const encoder = new GIFEncoder(mw, mh);

	encoder.start();
	encoder.setRepeat(0);
	encoder.setDelay(120);
	encoder.setQuality(100);

	const canvas = createCanvas(mw, mh);
	const ctx = canvas.getContext("2d");

	for (let u of frs) {
		u = new Uint8ClampedArray(u);
		for (let p = 0; p < u.length; p += 4) {
			const d = u[p | 3];
			u[p] = (u[p] * d + 255 * (255 - d)) >> 8;
			u[p | 1] = (u[p | 1] * d + 255 * (255 - d)) >> 8;
			u[p | 2] = (u[p | 2] * d + 255 * (255 - d)) >> 8;
			u[p | 3] = 0xff;
		}
		const im = createImageData(u, w, h);

		ctx.fillStyle = "#ffffff";
		ctx.fillRect(0, 0, mw, mh);

		for (let i = 0; i < bitmaps.length; ++i) {
			bitmaps[i] = bitmaps[i];
			for (let x = 0; x < size; ++x)
				for (let y = 0; y < size; ++y)
					if (bitmaps[i][x][y] == 1)
						ctx.putImageData(im, i * w * size + y * w, x * h);
		}

		encoder.addFrame(ctx);
	}

	encoder.finish();

	return encoder.out.getData();
}

module.exports = async (req, res) => {
	const { text, size } = req.query;

	return res.send(
		await getImg(text, size),
		{ "Content-Type": "image/gif" },
		200
	);
};
