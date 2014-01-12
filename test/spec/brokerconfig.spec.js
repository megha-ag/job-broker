/* jslint node: true */
"use strict";

var path = require('path');
var fs = require('fs');

var modulePath = path.join(__dirname, "../../src/broker.js");
var brokerModule = require(modulePath);
var broker = new brokerModule.JobBroker();
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

describe("Testing of the broker configuration module", function () {
  it("checks for error when config file is empty", function () {
	callResult = undefined;
	broker.load(getTestFilePath("empty.json"), function(result) {
		//Could not load JSON
		expect(result.errorCode).toBe(1000);
		callResult = result;
	});
	waitsFor(resultCheck);
  });

  it("checks for error when config file has no nodes", function () {
	callResult = undefined;
	broker.load(getTestFilePath("nonodes.json"), function(result) {
		//Worker module undefined
		expect(result.errorCode).toBe(1004);
		callResult = result;
	});
	waitsFor(resultCheck);
  });

  it("checks for error when config file does not exist", function () {
	callResult = undefined;
	broker.load("randon", function(result) {
		//File not found
		expect(result.errorCode).toBe(1003);
		callResult = result;
	});
	waitsFor(resultCheck);
  });

  it("checks for error when workers node contains no workers", function () {
	callResult = undefined;
	broker.load(getTestFilePath("zeroworkers.json"), function(result) {
		//Workers node not defined
		expect(result.errorCode).toBe(1005);
		callResult = result;
	});
	waitsFor(resultCheck);
  });

  it("checks for error when a worker definition has no job-type", function () {
	callResult = undefined;
	broker.load(getTestFilePath("validbroker-jobtype-missing.json"), function(result) {
		//Workers node not defined
		expect(result.errorCode).toBe(1006);
		callResult = result;
	});
	waitsFor(resultCheck);
  });

  it("checks for error when a worker definition has no worker", function () {
	callResult = undefined;
	broker.load(getTestFilePath("workernodemissing.json"), function(result) {
		//Workers node not defined
		expect(result.errorCode).toBe(1007);
		callResult = result;
	});
	waitsFor(resultCheck);
  });

  it("checks for error when a worker definition's worker node has no worker-module", function () {
	callResult = undefined;
	broker.load(getTestFilePath("workernomodule.json"), function(result) {
		//Workers node not defined
		expect(result.errorCode).toBe(1008);
		callResult = result;
	});
	waitsFor(resultCheck);
  });

  it("checks for error when a worker node's worker-module does not exist", function () {
	callResult = undefined;
	broker.load(getTestFilePath("workerbadmodulename.json"), function(result) {
		//Workers node not defined
		expect(result.errorCode).toBe(1009);
		callResult = result;
	});
	waitsFor(resultCheck);
  });

  it("checks for error during worker module initialization", function () {
	callResult = undefined;
	broker.load(getTestFilePath("workerinitializeerror.json"), function(result) {
		//Workers node not defined
		expect(result.errorCode).toBe(1010);
		callResult = result;
	});
	waitsFor(resultCheck);
  });

  it("checks for error when a worker definition has no queue", function () {
	callResult = undefined;
	broker.load(getTestFilePath("noqueue.json"), function(result) {
		//Workers node not defined
		expect(result.errorCode).toBe(1011);
		callResult = result;
	});
	waitsFor(resultCheck);
  });

  it("checks for error when a worker definition's queue node has no queue-module", function () {
	callResult = undefined;
	broker.load(getTestFilePath("noqueuemodule.json"), function(result) {
		//Workers node not defined
		expect(result.errorCode).toBe(1012);
		callResult = result;
	});
	waitsFor(resultCheck);
  });

  it("checks for error when a queue node's queue-name does not exist", function () {
	callResult = undefined;
	broker.load(getTestFilePath("queuenoqueuename.json"), function(result) {
		//Workers node not defined
		expect(result.errorCode).toBe(1013);
		callResult = result;
	});
	waitsFor(resultCheck);
  });

  it("checks for error when a queue node's queue-module does not exist", function () {
	callResult = undefined;
	broker.load(getTestFilePath("queuebadmodule.json"), function(result) {
		//Workers node not defined
		expect(result.errorCode).toBe(1014);
		callResult = result;
	});
	waitsFor(resultCheck);
  });

  it("checks for error during queue module initialization", function () {
	callResult = undefined;
	broker.load(getTestFilePath("queuebadinitialization.json"), function(result) {
		//Workers node not defined
		expect(result.errorCode).toBe(1015);
		callResult = result;
	});
	waitsFor(resultCheck);
  });

  it("checks for a valid configuration", function () {
	callResult = undefined;
	broker.load(getTestFilePath("good.json"), function(result) {
		//Workers node not defined
		expect(result.errorCode).toBe(0);
		callResult = result;
	});
	waitsFor(resultCheck);
  });
});