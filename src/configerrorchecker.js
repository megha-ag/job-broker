/* jslint node: true */
"use strict";
var util = require('util');
exports.checker = function(cb, cp) {
	var callback = cb;
	var configPath = cp;
	
	var checker = {};
	
	//This object will be passed to the callback if callback is defined
	var resultObj;
	
	//Callback with error result
	function makeCallback() {	
		if(callback) {
			callback(resultObj);
		}
	}
	
	checker.checkFileExistsError = function(errorCodes, fs, path) {
		//Check if file exists
		try {
			// Query the entry
			var stats = fs.lstatSync(configPath);

			// Is it a directory?
			if (stats.isDirectory()) {
				resultObj = util._extend({}, errorCodes.brokerConfig_ConfigFileNotFound);
				resultObj.errorMessage = resultObj.errorMessage.replace("_", configPath);
				makeCallback();
				return true;
			}
		}
		catch (e) {
			//It doesn't exist
			resultObj = util._extend({}, errorCodes.brokerConfig_ConfigFileNotFound);
			resultObj.errorMessage = resultObj.errorMessage.replace("_", configPath);
			makeCallback();
			return true;
		}
		return false;
	};
	
	checker.checkJsonLoadingError = function(errorCodes, config, configPath) {
		try
		{
			//Try parsing the JSON file
			config.file({ file: configPath });
		}
		catch(err) {
			//Could not parse
			resultObj = errorCodes.brokerConfig_CouldNotLoadJson;
			makeCallback();
			return true;
		}
		return false;
	};
	
	checker.checkWorkersNode = function(errorCodes, workerObjs) {
		if(!workerObjs) {
			//The workers node is not defined
			resultObj = errorCodes.brokerConfig_WorkersNotSpecified;
			makeCallback();
			return true;
		}
		
		if(!workerObjs.length) {
			//The workers node doesn't have any workers
			resultObj = errorCodes.brokerConfig_NoWorkers;
			makeCallback();
			return true;
		}
		
		return false;
	};
	
	checker.checkJobType = function(errorCodes, workerConfig, i) {
		if(!workerConfig["job-type"]) {
			//The object node doesn't have any job-type
			resultObj = util._extend({}, errorCodes.brokerConfig_JobTypeMissing);
			resultObj.errorMessage = resultObj.errorMessage.replace("_", (i + 1));
			makeCallback();
			return true;
		}
		return false;
	};
	
	checker.checkWorkerNode = function(errorCodes, workerConfig, i) {
		if(!workerConfig["worker"]) {
			//The object node doesn't define a worker
			resultObj = util._extend({}, errorCodes.brokerConfig_WorkerNodeMissing);
			resultObj.errorMessage = resultObj.errorMessage.replace("_", (i + 1));
			makeCallback();
			return true;
		}
		return false;
	};
	
	checker.checkWorkerModule = function(errorCodes, workerObj, i) {
		if(!workerObj["worker-module"]) {
			//The worker object node doesn't define a worker-module
			resultObj = util._extend({}, errorCodes.brokerConfig_WorkerModuleMissing);
			resultObj.errorMessage = resultObj.errorMessage.replace("_", (i + 1));
			makeCallback();
			return true;
		}
		return false;
	};
	
	checker.checkLoadWorkerModule = function(errorCodes, path, workerObj, workerModuleName, i, checkerObj) {
		//Path to the module
		var workerModulePath;
		if(workerModuleName.length > 3 && workerModuleName.substring(workerModuleName.length - 2).toLowerCase() === "js") {
			workerModulePath = path.join(__dirname, "../../../" + workerModuleName);
		}
		else {
			workerModulePath = path.join(__dirname, "workers/" + workerModuleName + ".js");
		}
		
		try
		{
			//Try to load from the files
			checkerObj.workerModule = require(workerModulePath).worker();
		}
		catch(err) {
			//The worker module could not be loaded
			resultObj = util._extend({}, errorCodes.brokerConfig_WorkerModuleCouldNotBeLoaded);
			resultObj.errorMessage = resultObj.errorMessage.replace("_", workerModuleName);
			makeCallback();
			return true;
		}
		
		try
		{
			//Try to initialize with settings from the file
			checkerObj.workerModule.init(workerObj["worker-settings"]);
		}
		catch(err) {
			//The worker module could not be initialized
			resultObj = util._extend({}, errorCodes.brokerConfig_WorkerModuleCouldNotBeInitialized);
			resultObj.errorMessage = resultObj.errorMessage.replace("_1_", workerModuleName);
			resultObj.errorMessage = resultObj.errorMessage.replace("_2_", err);
			makeCallback();
			return true;
		}
		return false;
	};
	
	checker.checkQueueNode = function(errorCodes, workerConfig, i) {
		if(!workerConfig["queue"]) {
			//The object node doesn't define a queue
			resultObj = util._extend({}, errorCodes.brokerConfig_QueueNodeMissing);
			resultObj.errorMessage = resultObj.errorMessage.replace("_", (i + 1));
			makeCallback();
			return true;
		}
		return false;
	};
	
	checker.checkQueueModule = function(errorCodes, queueObj, i) {
		if(!queueObj["queue-module"]) {
			//The queue object node doesn't define a queue-module
			resultObj = util._extend({}, errorCodes.brokerConfig_QueueModuleMissing);
			resultObj.errorMessage = resultObj.errorMessage.replace("_", (i + 1));
			makeCallback();
			return true;
		}
		return false;
	};
	
	checker.checkQueueName = function(errorCodes, queueObj, i) {
		if(!queueObj["queue-name"]) {
			//The queue object node doesn't define a queue-name
			resultObj = util._extend({}, errorCodes.brokerConfig_QueueNameMissing);
			resultObj.errorMessage = resultObj.errorMessage.replace("_", (i + 1));
			makeCallback();
			return true;
		}
		return false;
	};
	
	checker.checkLoadQueueModule = function(errorCodes, path, jobType, queueModuleName, queueName, queueObj, i, chk) {
		//Path to the module
		var queueModulePath;
		if(queueModuleName.length > 3 && queueModuleName.substring(queueModuleName.length - 2).toLowerCase() === "js") {
			queueModulePath = path.join(__dirname, "../../../" + queueModuleName);
		}
		else {
			queueModulePath = path.join(__dirname, "queues/" + queueModuleName + ".js");
		}
		
		try
		{
			//Try to load the module
			chk.queueModule = require(queueModulePath).load((i+1), jobType, queueModuleName, queueName, queueObj["queue-settings"]);
		}
		catch(err) {
			//The queue module could not be loaded
			resultObj = util._extend({}, errorCodes.brokerConfig_QueueModuleCouldNotBeLoaded);
			resultObj.errorMessage = resultObj.errorMessage.replace("_", queueModuleName);
			makeCallback();
			return true;
		}
		
		try
		{
			//Try to initialize
			chk.queueModule.init();
		}
		catch(err) {
			//The queue module could not be initialized
			resultObj = util._extend({}, errorCodes.brokerConfig_QueueModuleCouldNotBeInitialized);
			resultObj.errorMessage = resultObj.errorMessage.replace("_1_", queueModuleName);
			resultObj.errorMessage = resultObj.errorMessage.replace("_2_", err);
			makeCallback();
			return true;
		}
		
		return false;
	};
	
	return checker;
};