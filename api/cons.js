const { generate } = require("../lib/construct");

module.exports = async (req, res) => {
	const { text, size, pattern, type, transparent, background } = req.query;

	if (!text) return res.status(400);

	if (type !== "png" && type !== "gif") res.status(400);

	res.setHeader("Content-Type", `image/${type}`);
	res.setHeader("Content-Disposition", `attachment; filename=orz.gif`);

	console.log({
		pattern: `${pattern}.png`,
		type,
		transparent,
		background,
	});

	// return res.send(
	// 	await generate(text, size, {
	// 		pattern: `${pattern}.png`,
	// 		type,
	// 		transparent,
	// 		background,
	// 	})
	// );
	return res.send(
		await generate("我太菜了", 16, {
			type: "gif",
			transparent: false,
			background: "#ffffff",
			pattern: "0.png",
		})
	);
};
