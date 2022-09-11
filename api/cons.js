const { constructImg } = require("../lib/construct");

module.exports = async (req, res) => {
	const { text, size } = req.query;

	res.setHeader("Content-Type", `image/gif`);
	res.setHeader("Content-Disposition", `attachment; filename=orz.gif`);

	return res.send(await constructImg(text, size));
};
