var path = require("path");

var JobBroker = function() {
	this.load = function(file, callBack) {
		//Create closure and execute it asynchronously
		setTimeout(function() {
			//Keep locally in closure
			var configFile = file;
		
			var callback = callBack;
		
			//We'll load the error codes from the file into this
			var errorCodes;
			
			try
			{
				//Require the path module
				var path = require('path');
				//Require the nconf module
				var config = require('nconf');
				//Require the fs module to check if file exists
				var fs = require('fs');
				//Require the util module
				var util = require('util');
			
				//In the case of an error resultObj is set to one of the errors below
				errorCodes = require(path.join(__dirname, "/errors.js")).errors;

				//Load the configuration
				var configPath;
				
				//Check if absolute or relative path
				if(configFile.charAt(0) === '/') {
					configPath = configFile;
				}
				else {
					configPath = path.join(__dirname, "../../../" + configFile);
				}
			
				//Load the checker module
				var checker = require(path.join(__dirname, "/configerrorchecker.js")).checker(callBack, configPath);

				//Check for file not found error
				if(checker.checkFileExistsError(errorCodes, fs, path)) {
					return;
				}

				//Check if we could load the JSON
				if(checker.checkJsonLoadingError(errorCodes, config, configPath)) {
					return;
				}
			
				//The actual broker module
				var broker = require(path.join(__dirname, "brokers/default-broker.js")).broker;
			
				//Let's load the workers
				var workerObjs = config.get("workers");
			
				//Check that there is at least one worker definition
				if(checker.checkWorkersNode(errorCodes, workerObjs)) {
					return;
				}
			
				//Counter to iterate through workers etc.
				var i;
			
				//Variable to keep a loaded worker config
				var workerConfig;
			
				//Go through all the workers
				for(i=0; i<workerObjs.length; i++) {
					workerConfig = workerObjs[i];
				
					//Check that job-type is defined
					if(checker.checkJobType(errorCodes, workerConfig, i)) {
						return;
					}
				
					//Store the job type
					var jobType = workerConfig["job-type"];
				
					//Worker node must exist
					if(checker.checkWorkerNode(errorCodes, workerConfig, i)) {
						return;
					}
				
					//Get the node
					var workerObj = workerConfig.worker;
				
					//worker-module must exist
					if(checker.checkWorkerModule(errorCodes, workerObj, i)) {
						return;
					}
				
					//Get the module name
					var workerModuleName = workerObj["worker-module"];
				
					//Object to load worker in
					var workerCheck = { workerModule:undefined };
				
					//Check if worker module can be loaded and initialized
					if(checker.checkLoadWorkerModule(errorCodes, path, workerObj, workerModuleName, i, workerCheck)) {
						return;
					}
				
					//The module itself
					var workerModule = workerCheck.workerModule;
				
					//Queue node must exist
					if(checker.checkQueueNode(errorCodes, workerConfig, i)) {
						return;
					}
				
					//Store it
					var queueObj = workerConfig.queue;
				
					//It must comtain a queue-module node
					if(checker.checkQueueModule(errorCodes, queueObj, i)) {
						return;
					}
				
					//It must also have a queue name
					if(checker.checkQueueName(errorCodes, queueObj, i)) {
						return;
					}
				
					//Store the queue name
					var queueName = queueObj["queue-name"];
				
					//Standardise queue names to lower case
					queueName = queueName.toLowerCase().trim();
				
					//Store the queue module name
					var queueModuleName = queueObj["queue-module"];
				
					var checkerq = { queueModule: undefined };
				
					//Check if we can load the queue module
					if(checker.checkLoadQueueModule(errorCodes, path, jobType, queueModuleName, queueName, queueObj, i, checkerq)) {
						return true;
					}
				
					var queueModule = checkerq.queueModule;
				
					//We now have the worker module and the queuemodule loaded
					//Let's add some meta data:
					workerModule.workerNumber = (i+1);
					workerModule.moduleName = workerModuleName;
					
					if(checker.checkQueueConstraint(errorCodes, queueModuleName, queueName)) {
						return true;
					}
				
					//Register this stuff with the broker
					broker.register(jobType, workerModule, queueModule);
				}

				//We don't need the checker anymore
				checker = null;
				
				//Success
				var resultObj = util._extend({}, errorCodes.none);
				if(callback) {
					callback(resultObj, broker);
				}
			}
			catch(err) {
				var resultObj;
				if(!errorCodes) {
					resultObj = { errorCode: 1999, errorMessage:"An unknown error occurred:[_]" };
					resultObj.errorMessage = resultObj.errorMessage.replace("_", err);
					if(callback) {
						callback(resultObj);
					}
				}
				else {
					resultObj = util._extend({}, errorCodes.brokerConfig_UnknownError);
					resultObj.errorMessage = resultObj.errorMessage.replace("_", err);
					resultObj.configError = err;
					if(callback) {
						callback(resultObj);
					}
				}
			}
		}, 0); //settimeout
	}; //end load function
};

module.exports = {
	JobBroker:JobBroker,
	AbstractQueue:require(path.join(__dirname, "queues/abstractqueue.js")),
	AbstractWorker:require(path.join(__dirname, "workers/abstractworker.js"))
};