//This worker serves no real purpose. It is here in the repo as it is 
//used by the jasmine tests.

//Path stuff
var path = require("path");
//Load the AbstractWorker module
var AbstractWorker = require(path.join(__dirname, "/abstractworker.js"));

exports.worker = function() {
	//Error codes
	var errorCodes = require(path.join(__dirname, "../errors.js")).errors;
	//Create instance
	var worker = new AbstractWorker("console-settings");

	
	//Initialize
	worker.init = function() {
		//make sure settings and settings.name are defined
		worker.requireSettings();
		
		if(!worker.settings.name) {
			worker.throwError("This module requires name to be defined");
		}
	};
	
	
	//Process the message synchronously. If asynchronous processing is 
	//required, then make the async call and then callback:
	//worker.processCallback(worker.errorCodes.none, message);
	worker.work = function(message) {
		console.log("WORKER SAYS:");
		console.log(message);
		worker.processCallback(errorCodes.getError("none"), message);
	};
	
	return worker;
};