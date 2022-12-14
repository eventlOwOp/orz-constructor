const { generate } = require("../lib/generate");
const fs = require("fs/promises");

(async () => {
	fs.writeFile(
		"test/test.gif",
		await generate("我太菜了", 32, {
			type: "gif",
			transparent: false,
			background: "#ffffff",
			pattern: "0.png",
			font: "simsun",
		})
	);
	fs.writeFile(
		"test/test.png",
		await generate("Orz", 16, {
			type: "png",
			transparent: true,
			pattern: "1.png",
		})
	);
})();
