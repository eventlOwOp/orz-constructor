const { generate } = require("../lib/construct");

module.exports = async (req, res) => {
	const { text, size, pattern, type, transparent, background } = req.query;

	if (!text) return res.status(400);

	if (type !== "png" && type !== "gif") res.status(400);

	transparent = parseInt(transparent);

	res.setHeader("Content-Type", `image/${type}`);
	res.setHeader("Content-Disposition", `attachment; filename=orz.gif`);

	console.log({
		text,
		size,
		pattern: `${pattern}.png`,
		type,
		transparent,
		background,
	});

	return res.send(
		await generate(text, size, {
			pattern: `${pattern}.png`,
			type,
			transparent,
			background,
		})
	);
};
