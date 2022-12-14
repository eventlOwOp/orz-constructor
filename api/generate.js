const { generate } = require("../lib/generate");

module.exports = async (req, res) => {
	let { text, size, pattern, type, transparent, background, font } = req.query;

	if (!text) return res.status(400);

	if (type !== "png" && type !== "gif") res.status(400);
	if (font !== "simsun" && font !== "msyh") res.status(400);
	if (size !== "16" && size !== "32") res.status(400);

	transparent = parseInt(transparent);
	pattern = pattern + ".png";

	res.setHeader("Content-Type", `image/${type}`);
	res.setHeader("Content-Disposition", `attachment; filename=orz.${type}`);

	return res.send(
		await generate(text, size, {
			pattern,
			type,
			transparent,
			background,
			font,
		})
	);
};
