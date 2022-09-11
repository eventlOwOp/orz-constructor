const { constructImg } = require("../lib/construct");

(async () => {
	fs.writeFile("1.gif", await constructImg("我太菜了", 16));
})();
