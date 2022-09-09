const fs = require("fs").promises;
const path = require("path");

module.exports = async (req, res) => {
	const fp0 = path.join(process.cwd(), "api", "index.html");

	return res.send(fs.readFile(fp0));
};
