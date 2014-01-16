/*global beforeEach, afterEach, describe, expect, it, spyOn, xdescribe, xit, waitsFor */
"use strict";

var path = require('path');
var fs = require('fs');

var modulePath = path.join(__dirname, "../../src/broker.js");
var brokerModule = require(modulePath);
//Create object in debug mode
var broker = new brokerModule.JobBroker(true);
var callResult;

function getTestFilePath(filename) {
	if(filename.charAt(0) === '/') {
		filename = filename.substring(1);
	}
	return path.join(__dirname, "../files/badconfig/" + filename);
}

function resultCheck() {
	return callResult !== undefined;
}

describe("Testing of broker (larger granularity)", function () {

  it("tests pushMany (AWS) functionality producing and consuming 5 messages", function () {
	callResult = undefined;
	var messagesConsumed = 0;
	var messagesToProduce = 5;

	broker.load(getTestFilePath("good-aws.json"), function(result, brokerObj) {
		//Should be no error
		expect(result.errorCode).toBe(result.errorCodes.none.errorCode);
		
		var messages = [];

		//batch size for AWS is max 10
		for(var i=0; i<messagesToProduce; i++) {
			var message = {};
			message.jobType = "sendmsg";
			message.payload = {};
			message.payload.from = "me@sent.ly";
			message.payload.to = "you@gmail.com";
			message.payload.emailId = "Message " + (i + 1);
			message.payload.text = "Message " + (i + 1) + " intime: " + (new Date()).toTimeString().split(' ')[0];
			messages.push(message);
		}
		
		//The event callback functions
		function queueErrorFunction(err, msg) {
            console.log("ERROR:");
            console.log(err);
            console.log(msg);
            
            messagesConsumed++;
			if(messagesConsumed === messagesToProduce) {
				brokerObj.stop();
			}
        }
		
		function workCompletedFunction() {
			messagesConsumed++;
			if(messagesConsumed === messagesToProduce) {
				brokerObj.stop();
			}
		}
		
		function brokerStartedFunction() {
			brokerObj.pushMany(messages);
		}
		
		function brokerStoppedFunction() {
			unregister();
		}
		
		function queueEmptyFunction(worker, queue) {
			//Start listening
			queue.start();
		}
		
		function queueReadyFunction(worker, queue) {
            //Ensure that the queue is empty
            queue.ensureEmpty();
        }
		
		//The unregister function
		function unregister() {
			brokerObj.removeListener("work-completed", workCompletedFunction);
			brokerObj.removeListener("queue-error", queueErrorFunction);
			brokerObj.removeListener("broker-started", brokerStartedFunction);
			brokerObj.removeListener("queue-ready", queueReadyFunction);
			brokerObj.removeListener("broker-stopped", brokerStoppedFunction);
			brokerObj.removeListener("queue-empty", queueEmptyFunction);
			//We don't need the broker stuff any more
			brokerObj = null;
			broker = null;
			callResult = true;
		}
		
		//Register for the events
		brokerObj.on("queue-empty", queueEmptyFunction);
		brokerObj.on("work-completed", workCompletedFunction);
		brokerObj.on("queue-error", queueErrorFunction);
		brokerObj.on("queue-ready", queueReadyFunction);
		brokerObj.on("broker-started", brokerStartedFunction);
		brokerObj.on("broker-stopped", brokerStoppedFunction);

		brokerObj.connect();
	});
	//Wait for 120 secs (emptying a queue takes 1 minute)
	waitsFor(resultCheck, 120000);
  });
});