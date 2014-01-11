/* jslint node: true */
"use strict";

//This worker serves no real purpose. It is here in the repo as it is 
//used by the jasmine tests.

//Path stuff
var path = require("path");
//Load the AbstractWorker module
var AbstractWorker = require(path.join(__dirname, "/abstractworker.js"));

exports.worker = function() {
	//Create instance
	var worker = new AbstractWorker("console-settings");
	//store worker module settings
	var settings;
	
	//Initialize
	worker.init = function(workerSettings) {
		//make sure settings and settings.name are defined
		if(!workerSettings) {
			worker.throwError("This module requires settings to be defined");
		}
		if(!workerSettings.name) {
			worker.throwError("This module requires name to be defined");
		}
		
		settings = workerSettings;
	};
	
	
	//Process the message synchronously. If asynchronous processing is 
	//required, then make the async call and then callback:
	//worker.processCallback(worker.errorCodes.none, message);
	worker.work = function(message) {		
		console.log("WORKER SAYS:");
		console.log(message);
		worker.processCallback(worker.errorCodes.none, message);
	};
	
	return worker;
};