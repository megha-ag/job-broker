/*global beforeEach, afterEach, describe, expect, it, spyOn, xdescribe, xit, waitsFor, runs */
"use strict";
var path = require('path');

var modulePath = path.join( __dirname, "../../src/broker.js");
var brokerModule = require(modulePath);
var broker = new brokerModule.JobBroker(true);

var flag;
var numQueueAlerts;
var numProcessed;
var intime, outime;

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
	
	it("verifies scheduling 1 message into the queue with a delay of 1 minute ", function(){
		
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
                intime = Date.now();
			}
			
			function workCompletedFunction(err, msg) {
				numProcessed++;
				expect(numProcessed).toBe(1);
                outime = Date.now();
                brokerObj.stop();
			}
						
			function queueReadyFunction(worker, queue) {
				queue.start();
			}
			
			function brokerStoppedFunction(){
                unregister();
				
			}
			
			function brokerStartedFunction() {
				brokerObj.schedule(message, 60);
			}
			
			
			brokerObj.on("queue-success", queueSucessFunction);
			brokerObj.on("work-completed", workCompletedFunction);
			brokerObj.on("queue-ready", queueReadyFunction);
			brokerObj.on("broker-stopped", brokerStoppedFunction);
			brokerObj.on("broker-started", brokerStartedFunction);
			
			brokerObj.connect();
			
			function unregister() {
				brokerObj.removeListener("queue-success", queueSucessFunction);
				brokerObj.removeListener("work-completed", workCompletedFunction);
				brokerObj.removeListener("queue-ready", queueReadyFunction);
				brokerObj.removeListener("broker-stopped", brokerStoppedFunction);
				brokerObj.removeListener("broker-started", brokerStartedFunction);
                
				broker = null;
				flag = true;
			}
			
			
		});
		//Wait for 70 secs
		waitsFor(rc, 70000);
		runs(function(){
			expect(numProcessed).toBe(numQueueAlerts);
			//The difference in date in milliseconds
			var diff = new Date(outime -intime);
			//It should have taken more than 1 minute
            expect(diff).toBeGreaterThan(60000);
		});
	});
		
});

