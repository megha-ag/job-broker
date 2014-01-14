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

  it("tests pushMany functionality producing and consuming 15 messages", function () {
	callResult = undefined;
	var messagesConsumed = 0;
	var messagesToProduce = 15;

	broker.load(getTestFilePath("good.json"), function(result, brokerObj) {
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
		
		brokerObj.on("work-completed", function() {
			messagesConsumed++;
			if(messagesConsumed === messagesToProduce) {
				callResult = true;
			}
		});
		
		brokerObj.on("queue-error", function(err, msg) {
            console.log("ERROR:");
            console.log(err);
            console.log(msg);
            
            messagesConsumed++;
			if(messagesConsumed === messagesToProduce) {
				callResult = true;
			}
        });
		
		brokerObj.on("broker-started", function() {
			brokerObj.pushMany(messages);
		});
		
		
		brokerObj.on("queue-ready", function(worker, queue) {
            //Tell the queue to start listening for messages
            queue.start();
        });

		brokerObj.connect();
	});
	//Wait fr 20 secs
	waitsFor(resultCheck, 20000);
  });
});