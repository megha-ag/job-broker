/* jslint node: true */
"use strict";

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
	
	//Load the error codes
	this.errorCodes = require(path.join(__dirname, "../errors.js")).errors;
	
	//Set the name
	this.name = name;
	
	//This
	var worker = this;
	
	//This should be monkey patched in children, but we define it here
	//just in case a child does not define it.
	this.init = function(settings) {
		console.log("Worker["+ name + "] does not implement init()");
	};
	
	//Utility method to throw a tagged error
	this.throwError = function(msg) {
		throw name + ":" + msg;
	};
	
	//Concrete workers should define a function called work(message)
	this.process = function(message)
	{
		try
		{
			this.work(message);
		}
		catch(err) {
			var error = util._extend({}, this.errorCodes.workerWork_UnexpectedError);
			error.errorMessage = error.errorMessage + err;
			error.workerError = err;
			setTimeout(function() { worker.processCallback(error, message); }, 0);
		}
	};
}

//Do the prototype stuff
util.inherits(AbstractWorker, EventEmitter);

module.exports = AbstractWorker;