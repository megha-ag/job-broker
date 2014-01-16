/*global beforeEach, afterEach, describe, expect, it, spyOn, xdescribe, xit, waitsFor, runs */
"use strict";
var path = require('path');

var modulePath = path.join( __dirname, "../../src/broker.js");
var brokerModule = require(modulePath);
var broker = new brokerModule.JobBroker(true);

var flag, intime, outime;
var numQueueAlerts;
var numProcessed, numProcessedError;

function getTestFilePath(filename) {
	if(filename.charAt(0) === '/') {
		filename = filename.substring(1);
	}
	return path.join(__dirname, "../files/badconfig/" + filename);
}


function rc(){
	return flag;
}

function brokerinterfacetests(qname, configfile){
	describe("Testing Broker Interface with " + qname, function(){
	
		it("verifies pushing 1 message into the queue", function(){
			
			flag = false;
			numQueueAlerts = 0;
			numProcessed = 0;
			broker.load(getTestFilePath(configfile), function(result, brokerObj){
				expect(result.errorCode).toBe(0);
				var message = {};
				message.jobType = "sendmsg";
				message.payload = {};
				message.payload.id = 1;
				
				function queueSucessFunction(err, msg){
					numQueueAlerts++;
					expect(numQueueAlerts).toBe(1);
				}
				
				function workCompletedFunction(err, msg) {
					numProcessed++;
					expect(numProcessed).toBe(1);
					brokerObj.stop();
				}
							
				function brokerStartedFunction(){
					brokerObj.push(message);
				}
				
				function queueReadyFunction(worker, queue) {
					queue.start();
				}
				
				function brokerStoppedFunction(){
					unregister();
				}
				
				brokerObj.on("queue-success", queueSucessFunction);
				brokerObj.on("work-completed", workCompletedFunction);
				brokerObj.on("broker-started", brokerStartedFunction);
				brokerObj.on("queue-ready", queueReadyFunction);
				brokerObj.on("broker-stopped", brokerStoppedFunction);
				
				brokerObj.connect();
				
				function unregister() {
					brokerObj.removeListener("work-completed", workCompletedFunction);
					brokerObj.removeListener("queue-success", queueSucessFunction);
					brokerObj.removeListener("broker-started", brokerStartedFunction);
					brokerObj.removeListener("queue-ready", queueReadyFunction);
					brokerObj.removeListener("broker-stopped", brokerStoppedFunction);
					
					brokerObj = null;
					flag = true;
				}
			});
			waitsFor(rc, 20000);
			runs(function(){
				expect(numProcessed).toBe(numQueueAlerts);
				//console.log("numQueueAlerts: " + numQueueAlerts);
				//console.log("numProc: " + numProcessed);
			});
		});
		
		it("checks for error when pushing messages with incompatible jobtypes using pushMany", function(){
			
			flag = false;
			numQueueAlerts = 0;
			numProcessed = 0;
			numProcessedError = 0;
			broker.load(getTestFilePath(configfile), function(result, brokerObj){
				expect(result.errorCode).toBe(0);
				var messages = [];
				for (var i = 0; i< 10; i++) {
					var message = {};
					message.jobType = "jobType1";
					message.payload = {};
					message.payload.id = i+1;
					message.payload.text = "message " + (i+1);
					messages.push(message);
				}
				messages[1].jobType = "jobType2";
				
				function queueSucessFunction(err, msg){
					numQueueAlerts++;
				}
				
				function queueErrorFunction(err, msg){
					numProcessedError++;
					expect(err.errorCode).toBe(err.errorCodes.queuePushMany_IncompatibleJobTypes.errorCode);
					brokerObj.stop();
				}
				
				function workCompletedFunction(err, msg) {
					numProcessed++;
				}
							
				function brokerStartedFunction(){
					brokerObj.pushMany(messages);
				}
				
				function queueReadyFunction(worker, queue) {
					queue.start();
				}
				
				function brokerStoppedFunction(){
					unregister();
				}
				
				brokerObj.on("queue-success", queueSucessFunction);
				brokerObj.on("work-completed", workCompletedFunction);
				brokerObj.on("broker-started", brokerStartedFunction);
				brokerObj.on("queue-ready", queueReadyFunction);
				brokerObj.on("broker-stopped", brokerStoppedFunction);
				brokerObj.on("queue-error", queueErrorFunction);
				
				brokerObj.connect();
				
				function unregister() {
					brokerObj.removeListener("work-completed", workCompletedFunction);
					brokerObj.removeListener("queue-success", queueSucessFunction);
					brokerObj.removeListener("broker-started", brokerStartedFunction);
					brokerObj.removeListener("queue-ready", queueReadyFunction);
					brokerObj.removeListener("broker-stopped", brokerStoppedFunction);
					brokerObj.removeListener("queue-error", queueErrorFunction);
					
					brokerObj = null;
					flag = true;
				}
			});
			waitsFor(rc, 20000);
			runs(function(){
				expect(numQueueAlerts).toBe(0);
				expect(numProcessed).toBe(0);
				expect(numProcessedError).toBe(1);
			});
		});
		
		it("verifies scheduling 1 message into the queue with a delay of 1 minute ", function(){
			
			flag = false;
			numQueueAlerts = 0;
			numProcessed = 0;
			broker.load(getTestFilePath(configfile), function(result, brokerObj){
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
			
					brokerObj = null;
					flag = true;
				}
				
				
			});
			//Wait for 70 secs
			waitsFor(rc, 70000);
			runs(function(){
				expect(numProcessed).toBe(numQueueAlerts);
				//The difference in date in milliseconds
				//It should have taken more than 1 minute
				expect(outime - intime).toBeGreaterThan(60000);
			});
		});
			
	});
}

brokerinterfacetests("SQS", "good-aws.json");
brokerinterfacetests("Redis Q", "good.json");




