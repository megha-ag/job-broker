var util = require('util');

exports.errors = (function() {
	var debug = false;
	
	var errors = {
		none: { errorCode: 0, errorMessage:undefined },
		brokerConfig_CouldNotLoadJson: { errorCode: 1000, errorMessage:"Could not load JSON configuration file!" },
		brokerConfig_ConfigFileNotFound: { errorCode: 1003, errorMessage:"The config file [%s] could not be loaded" },
		brokerConfig_WorkersNotSpecified: { errorCode: 1004, errorMessage:"The workers node could not be loaded" },
		brokerConfig_NoWorkers: { errorCode: 1005, errorMessage:"The workers node contains no valid workers" },
		brokerConfig_JobTypeMissing: { errorCode: 1006, errorMessage:"Worker [%s]: job-type must be set" },
		brokerConfig_WorkerNodeMissing: { errorCode: 1007, errorMessage:"Worker [%s]: worker must be set" },
		brokerConfig_WorkerModuleMissing: { errorCode: 1008, errorMessage:"Worker [%s]: worker-module must be set" },
		brokerConfig_WorkerModuleCouldNotBeLoaded: { errorCode: 1009, errorMessage:"Worker Module[%s]: worker module could not be loaded" },
		brokerConfig_WorkerModuleCouldNotBeInitialized: { errorCode: 1010, errorMessage:"Initialization Error in Worker Module[%s]: Worker module error - %s" },
		brokerConfig_QueueNodeMissing: { errorCode: 1011, errorMessage:"Worker [%s]: queue must be set" },
		brokerConfig_QueueModuleMissing: { errorCode: 1012, errorMessage:"Worker [%s]: queue-module must be set" },
		brokerConfig_QueueNameMissing: { errorCode: 1013, errorMessage:"Worker [%s]: queue-name must be set" },
		brokerConfig_QueueModuleCouldNotBeLoaded: { errorCode: 1014, errorMessage:"Worker Module[%s]: queue module could not be loaded" },
		brokerConfig_QueueModuleCouldNotBeInitialized: { errorCode: 1015, errorMessage:"Initialization Error in Worker Module[%s]: Queue module error - %s" },
		brokerConfig_QueueDefinedTwice: { errorCode: 1016, errorMessage:"Queue with Module[%s] and Name[%s] is defined more than once" },
		brokerConfig_QueueNameInvalid: { errorCode: 1017, errorMessage:"Queue name[%s] is invalid. Queue names (case-insensitive) can only be 15 characters and contain only characters A-Z or 1-9" },
		brokerConfig_UnknownError: { errorCode: 1999, errorMessage:"An unknown error occurred:[%s]" },
		queueInit_ErrorLoadingQueuesList: { errorCode: 2000, errorMessage:"Could not load list of queues - %s" },
		queueInit_ErrorCreatingQueue: { errorCode: 2001, errorMessage:"Could not create queue[%s] - %s" },
		queueInit_ErrorCreatingQueueUnexpectedResponse: { errorCode: 2002, errorMessage:"Could not create queue[%s] - Response: %s" },
		queueReceive_ErrorReceivingMessage: { errorCode: 2003, errorMessage:"Could not receive message queue[%s] - Error: %s" },
		queuePush_FailedToInitialize: { errorCode: 2004, errorMessage:"Could not initialize queue" },
		queuePush_PushError: { errorCode: 2005, errorMessage:"Unexpected error: %s" },
		queueInvisibilityTimeout_FailedToInitialize: { errorCode: 2006, errorMessage:"Could not initialize queue" },
		queueInvisibilityTimeout_SetError: { errorCode: 2007, errorMessage:"Unexpected error: %s" },
		queueDelete_FailedToInitialize: { errorCode: 2008, errorMessage:"Could not initialize queue" },
		queueDelete_DeleteError: { errorCode: 2009, errorMessage:"Unexpected error: %s" },
		queuePushMany_TooManyMessages: { errorCode: 2010, errorMessage:"Too many messages" },
		queuePushMany_IncompatibleJobTypes: { errorCode: 2011, errorMessage:"pushMany() can only be used to push messages of the same jobType" },
		queuePushMany_TooManyQueues: { errorCode: 2012, errorMessage:"pushMany() can only be used for a jobType registered for a single queue" },
		queuePushMany_AlreadyPushing: { errorCode: 2013, errorMessage:"pushMany() already in progress for jobType[%s]. Please wait for queue-pushmany-completed event before calling pushMany() again." },
		workerWork_UnexpectedError: { errorCode: 3001, errorMessage:"Unexpected error occurred while calling worker.work - %s" }
	};
	
	var errorService = {};
	
	//Gets an error object based on its name
	errorService.getError = function(errName) {
		if(errors[errName]) {
			//We don't want anyone messing around with the error object
			//as this is a singleton due to require caching
			var toRet = util._extend({}, errors[errName]);
			//There is no need to pass this big object around
			//all the time
			if(debug) {
				//We don't need this to be terribly efficient since we do this
				//only in debug mode, thus we use JSON.stringify to create
				//a deep copy of the errors object
				
				//We don't want anyone messing around with our errors object 
				//as this is a singleton (due to require caching)
				toRet.errorCodes = JSON.parse(JSON.stringify(errors));
			}
			
			return toRet;
		}
		else {
			throw("Undefined error name:" + errName);
		}
	};
	
	errorService.setDebug = function(val) {
		debug = val;
	};
	
	errorService.isDebug = function() {
		return debug;
	};
	
	return errorService;
})();