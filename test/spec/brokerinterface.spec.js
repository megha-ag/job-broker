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
	if(numQueueAlerts === 0 || numProcessed === 0) {
		return false;
	}
	return numQueueAlerts === numProcessed;
}

function rerror(){
	return flag;
}

function brokerinterfacetests(qname, configfile, wait_time){
	describe("Testing Broker Interface with " + qname, function(){
		it("verifies pushing 1 message into the queue", function(){
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
							
				function brokerStartedFunction(){
					brokerObj.push(message);
				}
				
				function queueReadyFunction(worker, queue) {
					queue.ensureEmpty();
				}
				
				function brokerStoppedFunction(){
					unregister();
				}
				
				function queueEmptyFunction(worker, queue) {
					queue.start();
				}
				
				function queueErrorFunction(err, msg) {
					console.log("ERROR:");
					console.log(err);
					console.log(msg);
				}
				
				brokerObj.on("queue-success", queueSucessFunction);
				brokerObj.on("work-completed", workCompletedFunction);
				brokerObj.on("broker-started", brokerStartedFunction);
				brokerObj.on("queue-ready", queueReadyFunction);
				brokerObj.on("broker-stopped", brokerStoppedFunction);
				brokerObj.on("queue-empty", queueEmptyFunction);
				brokerObj.on("queue-error", queueErrorFunction);
				
				brokerObj.connect();
				
				function unregister() {
					brokerObj.removeListener("work-completed", workCompletedFunction);
					brokerObj.removeListener("queue-success", queueSucessFunction);
					brokerObj.removeListener("broker-started", brokerStartedFunction);
					brokerObj.removeListener("queue-ready", queueReadyFunction);
					brokerObj.removeListener("broker-stopped", brokerStoppedFunction);
					brokerObj.removeListener("queue-empty", queueEmptyFunction);
					brokerObj.removeListener("queue-error", queueErrorFunction);
					
					brokerObj = null;
					
				}
			});
			waitsFor(rc, 20000 + wait_time);
			runs(function(){
				expect(numProcessed).toBe(numQueueAlerts);
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
					queue.ensureEmpty();
				}
				
				function brokerStoppedFunction(){
					unregister();
				}
				
				function queueEmptyFunction(worker, queue) {
					queue.start();
				}
				
				brokerObj.on("queue-success", queueSucessFunction);
				brokerObj.on("work-completed", workCompletedFunction);
				brokerObj.on("broker-started", brokerStartedFunction);
				brokerObj.on("queue-ready", queueReadyFunction);
				brokerObj.on("broker-stopped", brokerStoppedFunction);
				brokerObj.on("queue-error", queueErrorFunction);
				brokerObj.on("queue-empty", queueEmptyFunction);

				brokerObj.connect();
				
				function unregister() {
					brokerObj.removeListener("work-completed", workCompletedFunction);
					brokerObj.removeListener("queue-success", queueSucessFunction);
					brokerObj.removeListener("broker-started", brokerStartedFunction);
					brokerObj.removeListener("queue-ready", queueReadyFunction);
					brokerObj.removeListener("broker-stopped", brokerStoppedFunction);
					brokerObj.removeListener("queue-error", queueErrorFunction);
					brokerObj.removeListener("queue-empty", queueEmptyFunction);
					
					brokerObj = null;
					flag = true;
				}
			});
			waitsFor(rerror, 20000 + wait_time);
			runs(function(){
				expect(numQueueAlerts).toBe(0);
				expect(numProcessed).toBe(0);
				expect(numProcessedError).toBe(1);
			});
		});
		
		it("verifies scheduling 1 message into the queue with a delay of 1 minute ", function(){
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
					if(numQueueAlerts === numProcessed) {
						brokerObj.stop();
					}
				}
				
				function workCompletedFunction(err, msg) {
					numProcessed++;
					expect(numProcessed).toBe(1);
					outime = Date.now();
					if(numQueueAlerts === numProcessed) {
						brokerObj.stop();
					}
				}
				
				function queueErrorFunction(err, msg) {
					console.log("ERROR:");
					console.log(err);
					console.log(msg);
				}
							
				function queueReadyFunction(worker, queue) {
					queue.ensureEmpty();
				}
				
				function brokerStoppedFunction(){
					unregister();
					
				}
				
				function brokerStartedFunction() {
					brokerObj.schedule(message, 60);
				}
				
				function queueEmptyFunction(worker, queue) {
					//Start listening
					queue.start();
				}
				
				
				brokerObj.on("queue-success", queueSucessFunction);
				brokerObj.on("work-completed", workCompletedFunction);
				brokerObj.on("queue-ready", queueReadyFunction);
				brokerObj.on("broker-stopped", brokerStoppedFunction);
				brokerObj.on("broker-started", brokerStartedFunction);
				brokerObj.on("queue-empty", queueEmptyFunction);
				brokerObj.on("queue-error", queueErrorFunction);
				
				brokerObj.connect();
				
				function unregister() {
					brokerObj.removeListener("queue-success", queueSucessFunction);
					brokerObj.removeListener("work-completed", workCompletedFunction);
					brokerObj.removeListener("queue-ready", queueReadyFunction);
					brokerObj.removeListener("broker-stopped", brokerStoppedFunction);
					brokerObj.removeListener("broker-started", brokerStartedFunction);
					brokerObj.removeListener("queue-empty", queueEmptyFunction);
					brokerObj.removeListener("queue-error", queueErrorFunction);
					brokerObj = null;
					
				}
				
				
			});
			//Wait for 70 secs
			waitsFor(rc, 70000 + wait_time);
			runs(function(){
				expect(numProcessed).toBe(numQueueAlerts);
				//The difference in date in milliseconds
				var diff = outime - intime;
				//It should have taken more than 1 minute
				expect(diff).toBeGreaterThan(60000);
			});
		});
	});
}

brokerinterfacetests("SQS", "good-aws.json", 80000);
brokerinterfacetests("Redis Q", "good.json", 0);

