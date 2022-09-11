const fs = require("fs/promises");
const GIFEncoder = require("gifencoder");
const iconv = require("iconv-lite");
const upng = require("upng-js");
const { createCanvas, createImageData } = require("canvas");
const path = require("path");

function resource(filename) {
	return path.join(process.cwd(), "assets", filename);
}

function printBitmap(x, size) {
	for (let i = 0; i < size; ++i) {
		s = "";
		for (let j = 0; j < size; ++j) s += x[i][j];
		console.log(s);
	}
}
async function getBitmapBuf(ch, fd, size) {
	const code = iconv.encode(ch, "gbk");
	const area = code[0] - 0xa0;
	const index = code[1] - 0xa0;
	const offset = ((94 * (area - 1) + (index - 1)) * size * size) / 8;

	const bufsiz = (size * size) / 8;
	const buf = Buffer.alloc(bufsiz);
	await fd.read(buf, 0, bufsiz, offset);
	return buf;
}
function bufToBitmap(buf, size) {
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
async function getBitmaps(text, size) {
	const fp = resource(`HZK${size}`);
	fd = await fs.open(fp);
	let bufs = await Promise.all(
		text.split("").map((ch) => getBitmapBuf(ch, fd, size))
	);
	fd.close();
	return bufs.map((u) => bufToBitmap(u, size));
}

function RGBA2RGB(u, transparent, background, alpha_channel) {
	let bg = [];
	bg[0] = parseInt(background.slice(1, 3), 16);
	bg[1] = parseInt(background.slice(3, 5), 16);
	bg[2] = parseInt(background.slice(5, 7), 16);
	for (let p = 0; p < u.length; p += 4) {
		const d = u[p | 3];
		if (!alpha_channel && transparent && d == 0) continue;
		if (alpha_channel && transparent) continue;
		u[p] = (u[p] * d + bg[0] * (255 - d)) >> 8;
		u[p | 1] = (u[p | 1] * d + bg[1] * (255 - d)) >> 8;
		u[p | 2] = (u[p | 2] * d + bg[2] * (255 - d)) >> 8;
		u[p | 3] = 0xff;
	}
	return u;
}

async function _construct(
	text,
	size,
	transparent,
	bg,
	img,
	pushFrame,
	alpha_channel = false
) {
	bitmaps = await getBitmaps(text, size);

	const frs = upng.toRGBA8(img);

	const h = img.height;
	const w = img.width;

	const mw = w * size * text.length;
	const mh = h * size;

	const canvas = createCanvas(mw, mh);
	const ctx = canvas.getContext("2d");

	for (let u of frs) {
		u = new Uint8ClampedArray(u);
		u = RGBA2RGB(u, transparent, bg, alpha_channel);
		const im = createImageData(u, w, h);

		if (!transparent) {
			ctx.fillStyle = bg;
			ctx.fillStyle = ctx.fillRect(0, 0, mw, mh);
		}

		for (let i = 0; i < bitmaps.length; ++i) {
			for (let x = 0; x < size; ++x)
				for (let y = 0; y < size; ++y)
					if (bitmaps[i][x][y] == 1)
						ctx.putImageData(im, i * w * size + y * w, x * h);
		}

		pushFrame(ctx, canvas);
	}
}

exports.generate = async function (text, size, options) {
	const defs = {
		text,
		size,
		transparent: false,
		background: "#ffffff",
		pattern: "0.png",
		type: "png",
	};
	options = Object.assign(defs, options);
	if (options.type === "png") {
		return png(options);
	} else if (options.type === "gif") {
		return gif(options);
	}
};

async function gif(options) {
	const { text, size, transparent, background, pattern } = options;

	const img = upng.decode(await fs.readFile(resource(pattern)));

	const mw = img.width * size * text.length;
	const mh = img.height * size;

	const encoder = new GIFEncoder(mw, mh);

	encoder.start();
	encoder.setRepeat(0);
	encoder.setDelay(120);
	encoder.setQuality(100);

	if (transparent) encoder.setTransparent();

	await _construct(text, size, transparent, background, img, (ctx) =>
		encoder.addFrame(ctx)
	);

	encoder.finish();

	return encoder.out.getData();
}

async function png(options) {
	const { text, size, transparent, background, pattern } = options;

	const img = upng.decode(await fs.readFile(resource(pattern)));

	const mw = img.width * size * text.length;
	const mh = img.height * size;

	let frames = [];
	let delays = [];

	function BGRA2RGBA(u) {
		for (let i = 0; i < u.length; i += 4) {
			let p = u[i];
			u[i] = u[i | 2];
			u[i | 2] = p;
		}
		return u;
	}

	await _construct(
		text,
		size,
		transparent,
		background,
		img,
		(ctx, canvas) => {
			frames.push(BGRA2RGBA(canvas.toBuffer("raw")));
			delays.push(120);
		},
		true
	);
	return Buffer.from(upng.encode(frames, mw, mh, 100, delays));
}
