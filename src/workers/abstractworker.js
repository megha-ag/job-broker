//The util for prototype inheritance
var util = require('util');
//Path stuff
var path = require('path');
//For event emitter
var EventEmitter = require('events').EventEmitter;
 
//Our shared worker definition
function AbstractWorker(name) {
	//Make this an emitter
	EventEmitter.call(this);
	
	//Our broker
	var myBroker;
	
	//Our queue
	var myQueue;
	
	//Set broker
	this.setBroker = function(broker) {
		myBroker = broker;
	};
	
	//Get broker
	this.getBroker = function() {
		return myBroker;
	};
	
	//Set queue
	this.setQueue = function(queue) {
		myQueue = queue;
	};
	
	//Get queue
	this.getQueue = function() {
		return myQueue;
	};
	
	//Load the error codes
	var errorCodes = require(path.join(__dirname, "../errors.js")).errors;
	
	//Set the name
	this.name = name;
	
	//This
	var worker = this;
	
	//This should be monkey patched in children, but we define it here
	//just in case a child does not define it.
	this.init = function() {
		console.log("Worker["+ name + "] does not implement init()");
	};
	
	//Utility method to throw a tagged error
	this.throwError = function(msg) {
		throw name + ":" + msg;
	};
	
	this.requireSettings = function() {
		if(!worker.settings) {
			worker.throwError("This module requires settings to be defined");
		}
	};
	
	//Concrete workers should define a function called work(message)
	this.process = function(message)
	{
		try
		{
			this.work(message);
		}
		catch(err) {
			var error = errorCodes.getError("WORKER_UNEXPECTED_ERROR");
			error.errorMessage = util.format(error.errorMessage, err);
			error.workerError = err;
			setTimeout(function() { worker.processCallback(error, message); }, 0);
		}
	};
}

//Do the prototype stuff
util.inherits(AbstractWorker, EventEmitter);

module.exports = AbstractWorker;