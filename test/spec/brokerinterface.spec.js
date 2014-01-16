/*global beforeEach, afterEach, describe, expect, it, spyOn, xdescribe, xit, waitsFor, runs */
"use strict";
var path = require('path');

var modulePath = path.join( __dirname, "../../src/broker.js");
var brokerModule = require(modulePath);
var broker = new brokerModule.JobBroker(true);

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
	if(numQueueAlerts === 0 || numProcessed === 0) {
		return false;
	}
	return numQueueAlerts === numProcessed;
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
			
			function queueSucessFunction(err, msg){
				numQueueAlerts++;
				expect(numQueueAlerts).toBe(1);
                if(numQueueAlerts === numProcessed) {
					brokerObj.stop();
				}
			}
			
			function workCompletedFunction(err, msg) {
				numProcessed++;
				expect(numProcessed).toBe(1);
                if(numQueueAlerts === numProcessed) {
					brokerObj.stop();
				}
			}
						
			function queueReadyFunction(worker, queue) {
				queue.ensureEmpty();
			}
			
			function brokerStoppedFunction(){
                unregister();
				
			}
			
			function brokerStartedFunction() {
				brokerObj.push(message);
			}
			
			function queueEmptyFunction(worker, queue) {
				//Start listening
				queue.start();
			}
			
			//The event callback functions
			function queueErrorFunction(err, msg) {
                console.log("ERROR:");
                console.log(err);
                console.log(msg);
            }
			
			
			brokerObj.on("queue-empty", queueEmptyFunction);
			brokerObj.on("queue-success", queueSucessFunction);
			brokerObj.on("work-completed", workCompletedFunction);
			brokerObj.on("queue-ready", queueReadyFunction);
			brokerObj.on("broker-stopped", brokerStoppedFunction);
			brokerObj.on("broker-started", brokerStartedFunction);
			brokerObj.on("queue-error", queueErrorFunction);
			
			brokerObj.connect();
			
			function unregister() {
				brokerObj.removeListener("queue-empty", queueEmptyFunction);
				brokerObj.removeListener("queue-success", queueSucessFunction);
				brokerObj.removeListener("work-completed", workCompletedFunction);
				brokerObj.removeListener("queue-ready", queueReadyFunction);
				brokerObj.removeListener("broker-stopped", brokerStoppedFunction);
				brokerObj.removeListener("broker-started", brokerStartedFunction);
				brokerObj.removeListener("queue-error", queueErrorFunction);
                
				broker = null;
				flag = true;
			}
			
			
		});
		//Wait for 70 secs
		waitsFor(rc, 70000);
		runs(function(){
			expect(numProcessed).toBe(numQueueAlerts);
		});
	});
		
});

