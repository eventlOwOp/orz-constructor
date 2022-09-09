const fs = require("fs").promises;
const path = require("path");

module.exports = async (req, res) => {
	const fp0 = path.join(process.cwd(), "api", "index.html");
	const x = String(await fs.readFile(fp0));
	console.log(x);
	res.setHeader("content-type", "text/html; charset=utf-8");
	res.status(200).send(x);
};
