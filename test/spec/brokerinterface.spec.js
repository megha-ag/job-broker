/*global beforeEach, afterEach, describe, expect, it, spyOn, xdescribe, xit, waitsFor, runs */
"use strict";
var path = require('path');

var modulePath = path.join( __dirname, "../../src/broker.js");
var brokerModule = require(modulePath);
var broker = new brokerModule.JobBroker(true);

var numQueueAlerts;
var numProcessed;

function getTestFilePath(filename) {
	if(filename.charAt(0) === '/') {
		filename = filename.substring(1);
	}
	return path.join(__dirname, "../files/badconfig/" + filename);
}


function rc(){
	if(numQueueAlerts === 0 || numProcessed === 0) {
		return false;
	}
	return numQueueAlerts === numProcessed;
}


describe("Testing Broker Interface -", function(){
	
	it("verifies pushing 1 message into the queue", function(){
		numQueueAlerts = 0;
		numProcessed = 0;
		broker.load(getTestFilePath("good.json"), function(result, brokerObj){
			expect(result.errorCode).toBe(0);
			var message = {};
			message.jobType = "sendmsg";
			message.payload = {};
			message.payload.id = 1;
			
			function queueSuccessFunction(err, msg){
				console.log("queue-success");
				numQueueAlerts++;
				expect(numQueueAlerts).toBe(1);
				if(numQueueAlerts === numProcessed) {
					brokerObj.stop();
				}
			}
			
			function workCompletedFunction(err, msg) {
				console.log("work-completed");
				numProcessed++;
				expect(numProcessed).toBe(1);
				if(numQueueAlerts === numProcessed) {
					brokerObj.stop();
				}
			}
						
			function brokerStartedFunction(){
				console.log("broker-started");
				brokerObj.push(message);
			}
			
			function queueReadyFunction(worker, queue) {
				console.log("queue-ready");
				queue.ensureEmpty();
			}
			
			function queueEmptyFunction(worker, queue) {
				console.log("queue-empty");
				queue.start();
			}
			
			function brokerStoppedFunction(){
				console.log("broker-stopped");
				unregister();
			}
			
			//The event callback functions
			function queueErrorFunction(err, msg) {
				console.log("queue-error");
				console.log(err);
				console.log(msg);
			}
			
			brokerObj.on("queue-empty", queueEmptyFunction);
			brokerObj.on("queue-success", queueSuccessFunction);
			brokerObj.on("work-completed", workCompletedFunction);
			brokerObj.on("broker-started", brokerStartedFunction);
			brokerObj.on("queue-ready", queueReadyFunction);
			brokerObj.on("queue-error", queueErrorFunction);
			brokerObj.on("broker-stopped", brokerStoppedFunction);
			
			brokerObj.connect();
			
			function unregister() {
				brokerObj.removeListener("queue-empty", queueEmptyFunction);
				brokerObj.removeListener("work-completed", workCompletedFunction);
				brokerObj.removeListener("queue-success", queueSuccessFunction);
				brokerObj.removeListener("broker-started", brokerStartedFunction);
				brokerObj.removeListener("queue-ready", queueReadyFunction);
				brokerObj.removeListener("broker-stopped", brokerStoppedFunction);
				brokerObj.removeListener("queue-error", queueErrorFunction);
				
				broker = null;
			}
		});
		waitsFor(rc, 20000);
		runs(function(){
			expect(numProcessed).toBe(numQueueAlerts);
			//console.log("numQueueAlerts: " + numQueueAlerts);
			//console.log("numProc: " + numProcessed);
		});
	});
		
});




