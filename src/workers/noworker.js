//This worker is a placeholder worker. It is a common use-case for an application 
//to be pushing messages from an API/Web Nodejs application and consuming them in
//another "worker" process, possibly running on a different instance. In such a case
//the worker definition in the API/Web Nodejs application is redundant. API/Web applications
//that only produce messages and do not consume them, should specify noworker as their
//worker module.

//Path stuff
var path = require("path");
//Load the AbstractWorker module
var AbstractWorker = require(path.join(__dirname, "/abstractworker.js"));
//Error codes
var errorCodes = require(path.join(__dirname, "../errors.js")).errors;

exports.worker = function() {
	//Create instance
	var worker = new AbstractWorker("noworker");
	
	//Initialize
	worker.init = function() {
	};
	
	worker.work = function(message) {
		worker.processCallback(errorCodes.getError("none"), message);
	};
	
	return worker;
};