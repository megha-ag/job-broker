var path = require("path");
var AbstractBroker = require(path.join(__dirname, "/abstractbroker.js"));

exports.broker = (function() {
	var broker = new AbstractBroker();
	
	return broker;
})();