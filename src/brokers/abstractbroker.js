//Required to set prototype of our AbstractBroker
var util = require('util');
//Path utils
var path = require('path');
//The event emiter
var EventEmitter = require('events').EventEmitter;
 
//Our abstract broker
function AbstractBroker(name) {
	//Make this an event emitter
	EventEmitter.call(this);
	
	//Load the error codes
	this.errorCodes = require(path.join(__dirname, "../errors.js")).errors;
	
	//Record our name
	this.name = name;
	
	//Record self reference
	var broker = this;
	
	//Event map to map a jobType to a queue
	var eventMap = {};
	
	//Number of queues that are started
	var queuesStarted = 0;
	
	//Total number of queues
	var queuesNumber = 0;
	
	//Total number of queues in ready state
	var queuesReady = 0;
	
	//Utility function to return the error meta info
	function getError(myWorker, myQueue, err) {
		var errorInfo = {};
		errorInfo.workerNumber = myWorker.workerNumber;
		errorInfo.worker = myWorker;
		errorInfo.queue = myQueue;
		errorInfo.error = err;
		return errorInfo;
	}
	
	this.register = function(jobType, workerModule, queueModule) {
		//We use only lowercase for jobType
		jobType = jobType.toLowerCase().trim();
		
		if(!eventMap[jobType]) {
			eventMap[jobType] = [];
		}
		
		eventMap[jobType].push(queueModule);
		
		//Let the worker have access to its queue in case it needs
		//to extend visibility timeout etc.
		workerModule.queue = queueModule;
		
		//After the worker has completed processing the message
		workerModule.processCallback = function(werr, message) {
			var myWorker = workerModule;
			var myQueue = queueModule;
			var myBroker = broker;
			
			var metaError = getError(myWorker, myQueue, werr);
			
			//Did the worker module succeed?
			if(werr.errorCode === 0) {
				//Yes it did, let's emit a work-completed event
				myBroker.emit("work-completed", metaError, message);
				//Try to delete the message
				myQueue.delete(message);
			}
			else {
				//Error while workin, emit it
				//Since message is not deleted,
				//It should become visible for
				//processing after some time
				myBroker.emit("work-error", metaError, message);
			}
		};
		
		//After a message is pushed to the queue
		queueModule.pushCallback = function (err, msg) {
			var errorInfo;
			var myWorker = workerModule;
			var myQueue = queueModule;
			var myBroker = broker;
			
			if(err && err.errorCode !== 0) {
				//Record error meta-info and emit the error
				errorInfo = getError(myWorker, myQueue, err);
				myBroker.emit("queue-error", errorInfo, msg);
			}
			else {
				//Record success meta-info and emit success
				errorInfo = getError(myWorker, myQueue, myQueue.errorCodes.none);
				myBroker.emit("queue-success", errorInfo, msg);
			}
		};
		
		//After all messages in pushMany call have been pushed to the queue
		//Structure of report is:
		/*
		{
			"successes":[message1, message2...],
			"failures":[
				{
					"message":message1,
					"error": customErrorObjectDependentOnQueueModule
				},
				etc.
			]
		}
		*/
		queueModule.pushManyCallback = function(report) {
			var myWorker = workerModule;
			var myQueue = queueModule;
			var myBroker = broker;
			
			var messageInfo = getError(myWorker, myQueue, myQueue.errorCodes.none);
			messageInfo.report = report;
			myBroker.emit("queue-pushmany-completed", messageInfo);
		};
		
		//After message message is deleted
		queueModule.deleteCallback = function(derr, message) {
			var myWorker = workerModule;
			var myQueue = queueModule;
			var myBroker = broker;
			
			var messageInfo = getError(myWorker, myQueue, myQueue.errorCodes.none);
			messageInfo.error = derr;
			//If we had a delete error, then emit it
			//Warning this can cause duplicate processing
			//since message will become visible again after
			//the timeout
			if(derr && derr.errorCode !== 0) {
				myBroker.emit("queue-error", messageInfo, message);
			}
			else {
				myBroker.emit("queue-deleted", messageInfo, message);
			}
		};
		
		//When a message is received
		queueModule.messageReceivedFunction = function(message) {
			var myBroker = broker;
			var myJobType = jobType;
			var myWorker = workerModule;
			var myQueue = queueModule;
			
			var messageInfo = getError(myWorker, myQueue, myQueue.errorCodes.none, message);
			
			//If the message has been dequeued too many times, just delete it straight away
			//as it is a "poison" message
			if(myQueue.maxDequeueCount && message.dequeueCount > myQueue.maxDequeueCount) {
				myBroker.emit("queue-poison", messageInfo);
				myQueue.delete(message);
				return;
			}
			
			//Emit the event in case someone wants to watch
			myBroker.emit("queue-received", messageInfo);
			
			//We make sure that the message has the right job type
			if(message.jobType.toLowerCase() === myJobType) {
				
				/* Without setting invisibility timeout */
				//We've made the message invisible for others for
				//our required amount of time, let's work on the message
				workerModule.process(message);
			} //end if for correct jobType
		};
		
		//If queue raised an error
		queueModule.errorFunction = function(err, msg) {
			//If the queue module raises an error,
			//Attach meta-info and emit it as a 
			//queue-error
			var myWorker = workerModule;
			var myQueue = queueModule;
			var myBroker = broker;
			
			var errorInfo = getError(myWorker, myQueue, err);
			myBroker.emit("queue-error", errorInfo, msg);
		};
		
		//Raised when queue is initialized and ready
		queueModule.readyFunction = function() {
			var myWorker = workerModule;
			var myQueue = queueModule;
			var myBroker = broker;
			
			//One more queue is ready
			queuesReady++;
			
			myBroker.emit("queue-ready", workerModule, queueModule);
			
			if(queuesReady === queuesNumber) {
				//All queues are initialized
				myBroker.emit("broker-initialized");
			}
		};
		
		//Called when a queue is listening for new messages
		queueModule.startedFunction = function() {
			var myWorker = workerModule;
			var myQueue = queueModule;
			var myBroker = broker;
			
			queuesStarted++;
			
			myBroker.emit("queue-started", workerModule, queueModule);
			
			if(queuesStarted === queuesNumber) {
				//All queues are initialized
				myBroker.emit("broker-started");
			}
		};
		
		//Called when a queue has stopped listening for new messages
		queueModule.stoppedFunction = function() {
			var myWorker = workerModule;
			var myQueue = queueModule;
			var myBroker = broker;
			
			queuesStarted--;
			
			myBroker.emit("queue-stopped", workerModule, queueModule);
			
			if(queuesStarted === 0) {
				myBroker.emit("broker-stopped");
			}
		};
		
		//Record the number of queues
		queuesNumber++;
	};
	
	//Pushes the message to all queues registered
	//for this type of message
	this.push = function(msg) {
		if(!msg.jobType) {
			return;
		}
		var queues = eventMap[msg.jobType.toLowerCase().trim()];
		if(!queues) {
			return;
		}
		for(var i=0; i<queues.length; i++) {
			var queueModule = queues[i];
			queueModule.push(msg);
		}
	};
	
	//Pushes many messages to the queue asynchronously
	this.pushMany = function(messages) {
		if(!messages || !messages.length) {
			return;
		}
		
		//TODO:Hard coded message limit for now
		if(messages.length > 1000) {
			broker.emit("queue-error", broker.errorCodes.queuePushMany_TooManyMessages);
			return;
		}
		
		var i;
		var jobType = messages[0].jobType.toLowerCase().trim();
		//Let's check for multiple job types in here
		for(i=0; i<messages.length; i++) {
			var jobTypeCheck = messages[i].jobType.toLowerCase().trim();
			if(jobType !== jobTypeCheck) {
				broker.emit("queue-error", broker.errorCodes.queuePushMany_IncompatibleJobTypes);
				return;
			}
		}
		
		var queues = eventMap[jobType];
		if(!queues) {
			return;
		}
		
		//jobType can only be registered for one queue
		if(queues.length !== 1) {
			broker.emit("queue-error", broker.errorCodes.queuePushMany_TooManyQueues);
			return;
		}
		
		//All is well
		setTimeout(function() { queues[0].pushMany(messages); }, 0);
	};
	
	//Pushes the message to all queues registered
	//for this type of message
	this.schedule = function(msg, when) {
		if(!msg.jobType) {
			return;
		}
		var queues = eventMap[msg.jobType.toLowerCase().trim()];
		if(!queues) {
			return;
		}
		for(var i=0; i<queues.length; i++) {
			var queueModule = queues[i];
			queueModule.schedule(msg, when);
		}
	};
	
	
	this.connect = function () {
		for(var propt in eventMap) {
			if (eventMap.hasOwnProperty(propt)) {
				var queues = eventMap[propt];
				if(queues) {
					for(var i=0; i<queues.length; i++) {
						var queueModule = queues[i];
						queueModule.connect();
					}
				}
			}
		}
	};
	
	//Emits the queue-stop message which all queues
	//listen for and thus, all queues stop listening
	//for messages
	this.stop = function () {
		for(var propt in eventMap) {
			if(eventMap.hasOwnProperty(propt)) {
				var queues = eventMap[propt];
				if(queues) {
					for(var i=0; i<queues.length; i++) {
						var queueModule = queues[i];
						queueModule.stop();
					}
				}
			}
		}
	};
	
	//Utility method to throw an error with tag
	this.throwError = function(msg) {
		throw name + ":" + msg;
	};
	
	//Utility method to log line to console with tag
	this.log = function(message) {
		console.log(name + ":" + message);
	};
}

util.inherits(AbstractBroker, EventEmitter);

module.exports = AbstractBroker;