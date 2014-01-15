/*global beforeEach, afterEach, describe, expect, it, spyOn, xdescribe, xit, waitsFor, runs */
"use strict";
var path = require('path');

var modulePath = path.join( __dirname, "../../src/broker.js");
var brokerModule = require(modulePath);
var broker = new brokerModule.JobBroker();

var flag;
var numQueueAlerts;
var numProcessed;

function getTestFilePath(filename) {
	if(filename.charAt(0) === '/') {
		filename = filename.substring(1);
	}
	return path.join(__dirname, "../files/badconfig/" + filename);
}


function rc(){
	return flag;
}


describe("Testing Broker Interface -", function(){
	
	it("verifies pushing 1 message into the queue", function(){
		
		flag = false;
		numQueueAlerts = 0;
		numProcessed = 0;
		broker.load(getTestFilePath("good.json"), function(result, brokerObj){
			expect(result.errorCode).toBe(0);
			var message = {};
			message.jobType = "sendmsg";
			message.payload = {};
			message.payload.id = 1;
			
			
			
			brokerObj.on("queue-success", function(err, msg) {
				
				numQueueAlerts++;
				expect(numQueueAlerts).toBe(1);
				//console.log("numQueueAlerts: " + numQueueAlerts);
				//console.log("numProc: " + numProcessed);
				
				
			});
			
			brokerObj.on("work-completed", function(err, message) {
				numProcessed++;
				expect(numProcessed).toBe(1);
				//console.log("numQueueAlerts: " + numQueueAlerts);
				//console.log("numProc: " + numProcessed);
				if (numProcessed === 1) {
					flag = true;
				}
				
				
			
			});
			
			brokerObj.on("broker-initialized", function(){
				
				brokerObj.push(message);
				
			});
			
			brokerObj.on("queue-ready", function(worker, queue) {
				queue.start();
			});
			
			brokerObj.connect();
			
			
	        });
		waitsFor(rc, 20000);
		runs(function(){
			expect(numProcessed).toBe(numQueueAlerts);
			//console.log("numQueueAlerts: " + numQueueAlerts);
			//console.log("numProc: " + numProcessed);
		});
	});
		
});




