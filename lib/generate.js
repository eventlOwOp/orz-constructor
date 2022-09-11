const fs = require("fs/promises");
const GIFEncoder = require("gifencoder");
const upng = require("upng-js");
const { createCanvas, createImageData } = require("canvas");
const { $Font } = require("bdfparser");
const getline = require("readlineiter");
const path = require("path");

function resource(filename) {
	return path.join(process.cwd(), "assets", filename);
}

async function getBitmaps(text, size) {
	const font = await $Font(getline(`assets/msyh${size}.bdf`));
	const bm = font.draw(text).bindata;
	let res = [];
	function allzero(x) {
		for (let u of bm[x]) if (u !== "0") return 0;
		return 1;
	}
	function vallzero(x) {
		for (let u of res) if (u[x] !== "0") return 0;
		return 1;
	}
	let l = 0;
	while (allzero(l)) ++l;
	let r = bm.length - 1;
	while (allzero(r)) --r;
	while (l <= r) res.push(bm[l++]);

	l = 0;
	while (vallzero(l)) ++l;
	r = res[0].length - 1;
	while (vallzero(r)) --r;
	for (let i = 0; i < res.length; ++i) res[i] = res[i].slice(l, r + 1);

	return {
		bitmap: res,
		width: res[0].length,
		height: res.length,
	};
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

async function _construct(options, pushFrame) {
	const { width, height, bitmaps, transparent, background, img } = options;
	const alpha_channel = options.type === "png";

	const frs = upng.toRGBA8(img);

	const canvas = createCanvas(width, height);
	const ctx = canvas.getContext("2d");

	for (let u of frs) {
		u = new Uint8ClampedArray(u);
		u = RGBA2RGB(u, transparent, background, alpha_channel);
		const im = createImageData(u, img.width, img.height);

		if (!transparent) {
			ctx.fillStyle = background;
			ctx.fillStyle = ctx.fillRect(0, 0, width, height);
		}

		for (let x = 0; x < bitmaps.height; ++x)
			for (let y = 0; y < bitmaps.width; ++y)
				if (bitmaps.bitmap[x][y] == 1)
					ctx.putImageData(im, y * img.width, x * img.height);

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

	const img = upng.decode(await fs.readFile(resource(options.pattern)));
	const bitmaps = await getBitmaps(text, size);
	options.img = img;
	options.bitmaps = bitmaps;
	options.height = img.height * bitmaps.height;
	options.width = img.width * bitmaps.width;

	if (options.type === "png") {
		return png(options);
	} else if (options.type === "gif") {
		return gif(options);
	}
};

async function gif(options) {
	const { width, height, transparent } = options;

	const encoder = new GIFEncoder(width, height);

	encoder.start();
	encoder.setRepeat(0);
	encoder.setDelay(120);
	encoder.setQuality(100);

	if (transparent) encoder.setTransparent();

	await _construct(options, (ctx) => encoder.addFrame(ctx));

	encoder.finish();

	return encoder.out.getData();
}

async function png(options) {
	const { width, height } = options;

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

	await _construct(options, (ctx, canvas) => {
		frames.push(BGRA2RGBA(canvas.toBuffer("raw")));
		delays.push(120);
	});
	return Buffer.from(upng.encode(frames, width, height, 100, delays));
}
