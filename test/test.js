const { generate } = require("../lib/construct");
const fs = require("fs/promises");

(async () => {
	fs.writeFile(
		"test/test.gif",
		await generate("我太菜了", 16, {
			type: "gif",
		})
	);
	fs.writeFile(
		"test/test.png",
		await generate("我太菜了", 16, {
			type: "png",
			transparent: true,
			pattern: "1.png",
		})
	);
})();
