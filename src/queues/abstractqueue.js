/* jslint node: true */
"use strict";

//for inheritance stuff
var util = require('util');
//Path stuff
var path = require('path');
//Event emitter stuff
var EventEmitter = require('events').EventEmitter;

//The class
function AbstractQueue(workerNumber, jobType, moduleName, queueName, settings) {
	this.workerNumber = workerNumber;
	this.jobType = jobType;
	this.queueName = queueName;
	this.moduleName = moduleName;
	this.settings = settings;
	//Default invisibilityTimeout is 1 minute
	this.invisibilityTimeout = 60;
	this.pushManyInProgress = false;
	this.name = "Worker[" + workerNumber + "], Jobtype[" + jobType + "], Queuetype[" + moduleName + "], Name[" + queueName + "]";
	
	//Is the queue initialized?
	//Queue initialization makes sure that the queue is created
	//in case it doesn't exist already
	this.queueInitialized = false;
	
	//Have we started to listen for messages from the queue?
	this.isStarted = false;
	
	//We poll the queue for updates at this interval (milliseconds).
	//Default value is 5 secs
	this.pollingInterval = 5000;
	
	//Max dequeue count. If a message is dequed so many times, then
	//it will be deleted straight away without any processing
	//Default value is 5
	this.maxDequeueCount = 5;
	
	var queue = this;
	
	EventEmitter.call(this);
	
	this.errorCodes = require(path.join(__dirname, "../errors.js")).errors;
	
	this.initPollingInterval = function() {
		if(!queue.settings["polling-interval"]) {
			queue.throwError("This module's settings need a polling-interval node");
		}
		
		queue.pollingInterval = parseInt(queue.settings["polling-interval"]);
		
		if(isNaN(queue.pollingInterval)) {
			queue.throwError("This module's settings, polling-interval must be a valid integer");
		}
	};
	
	this.initInvisibilityTimeout = function() {
		if(!queue.settings["invisibility-timeout"]) {
			queue.throwError("This module's settings need a invisibility-timeout node");
		}
		
		queue.invisibilityTimeout = parseInt(queue.settings["invisibility-timeout"]);
		if(isNaN(queue.invisibilityTimeout)) {
			queue.throwError("This module's settings, invisibility-timeout must be a valid integer");
		}
	};
	
	this.initMaxDequeueCount = function() {
		if(!queue.settings["max-dequeue-count"]) {
			queue.maxDequeueCount = 5;
		}
		else {
			queue.maxDequeueCount = parseInt(queue.settings["max-dequeue-count"]);
			if(isNaN(queue.maxDequeueCount)) {
				queue.throwError("This module's settings, max-dequeue-count must be a valid integer");
			}
		}
	};
	
	this.requireSettings = function() {
		if(!queue.settings) {
			queue.throwError("This module requires settings to be defined");
		}
	};
	
	this.isPushManyRunning = function() {
		if(this.pushManyInProgress) {
			var err = util._extend({}, this.errorCodes.queuePushMany_AlreadyPushing);
			err.errorMessage = err.errorMessage.replace("_", this.jobType);
			queue.onError(err);
			return true;
		}
		return false;
	};
	
	this.throwError = function(msg) {
		throw queue.name + ":" + msg;
	};
	
	this.log = function(message) {
		console.log(queue.name + ":" + message);
	};
	
	//This should be monkey patched in children, but we define it here
	//just in case a child does not define it.
	this.init = function() {
		queue.log("init() not implemented");
	};
	
	this.push = function(message) {
		queue.log("push() not implemented");
	};
	
	this.pushMany = function(messages) {
		queue.log("pushMany() not implemented");
	};
	
	this.schedule = function(message, when) {
		queue.log("schedule() not implemented");
	};
	
	this.delete = function(message) {
		queue.log("delete() not implemented");
	};
	
	this.setInvisibilityTimeout = function (message, when) {
		queue.log("setInvisibilityTimeout() not implemented");
	};
	
	this.start = function () {
		queue.log("start() not implemented");
	};
	
	this.stop = function () {
		queue.log("stop() not implemented");
	};
	
	//For internal use only
	this.onMessageReceived = function(message)
	{
		this.messageReceivedFunction(message);
	};
	
	//For internal use only
	this.onError = function(err, message)
	{
		this.errorFunction(err, message);
	};
	
	this.onReady = function() {
		this.readyFunction();
	};
	
	this.pushInitializationFailure = function(message) {
		var queueError = queue.errorCodes.queuePush_FailedToInitialize;
		queue.pushCallback(queueError, message);
		queueError = null;
	};
	
	this.deleteInitializationFailure = function(message) {
		var queueError = queue.errorCodes.queueDelete_FailedToInitialize;
		queue.deleteCallback(queueError, message);
		queueError = null;
	};
	
	this.visibilityInitializationFailure = function(message) {
		var queueError = queue.errorCodes.queueInvisibilityTimeout_FailedToInitialize;
		queue.visibilityCallback(queueError, message);
		queueError = null;
	};
}

util.inherits(AbstractQueue, EventEmitter);

module.exports = AbstractQueue;