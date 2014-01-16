var util = require('util');

exports.errors = (function() {
	var debug = false;
	
	//We kep Error code none at 0 as it's convenient to check if(err.errorCode) { }
	var errors = {
		none: { errorCategory: "ALL", errorCode: 0, errorMessage:undefined },
		brokerConfig_CouldNotLoadJson: { errorCategory:"CONFIG", errorCode: "JSON_PARSE_ERROR", errorMessage:"Could not load JSON configuration file!" },
		brokerConfig_ConfigFileNotFound: { errorCategory:"CONFIG", errorCode: "FILE_NOT_FOUND", errorMessage:"The config file [%s] could not be loaded" },
		brokerConfig_WorkersNotSpecified: { errorCategory:"CONFIG", errorCode: "NO_WORKERS_ARRAY", errorMessage:"The workers node could not be loaded" },
		brokerConfig_NoWorkers: { errorCategory:"CONFIG", errorCode: "WORKERS_ARRAY_EMPTY", errorMessage:"The workers node contains no valid workers" },
		brokerConfig_JobTypeMissing: { errorCategory:"CONFIG", errorCode: "JOB_TYPE_MISSING", errorMessage:"Worker [%s]: job-type must be set" },
		brokerConfig_WorkerNodeMissing: { errorCategory:"CONFIG", errorCode: "NO_WORKER_NODE", errorMessage:"Worker [%s]: worker must be set" },
		brokerConfig_WorkerModuleMissing: { errorCategory:"CONFIG", errorCode: "WORKER_MODULE_MISSING", errorMessage:"Worker [%s]: worker-module must be set" },
		brokerConfig_WorkerModuleCouldNotBeLoaded: { errorCategory:"CONFIG", errorCode: "UNABLE_TO_LOAD_WORKER_MODULE", errorMessage:"Worker Module[%s]: worker module could not be loaded" },
		brokerConfig_WorkerModuleCouldNotBeInitialized: { errorCategory:"CONFIG", errorCode: "UNABLE_TO_INITIALIZE_WORKER_MODULE", errorMessage:"Initialization Error in Worker Module[%s]: Worker module error - %s" },
		brokerConfig_QueueNodeMissing: { errorCategory:"CONFIG", errorCode: "QUEUE_NODE_MISSING", errorMessage:"Worker [%s]: queue must be set" },
		brokerConfig_QueueModuleMissing: { errorCategory:"CONFIG", errorCode: "QUEUE_MODULE_MISSING", errorMessage:"Worker [%s]: queue-module must be set" },
		brokerConfig_QueueNameMissing: { errorCategory:"CONFIG", errorCode: "QUEUE_NAME_MISSING", errorMessage:"Worker [%s]: queue-name must be set" },
		brokerConfig_QueueModuleCouldNotBeLoaded: { errorCategory:"CONFIG", errorCode: "UNABLE_TO_LOAD_QUEUE_MODULE", errorMessage:"Worker Module[%s]: queue module could not be loaded" },
		brokerConfig_QueueModuleCouldNotBeInitialized: { errorCategory:"CONFIG", errorCode: "UNABLE_TO_INITIALIZE_QUEUE_MODULE", errorMessage:"Initialization Error in Worker Module[%s]: Queue module error - %s" },
		brokerConfig_QueueDefinedTwice: { errorCategory:"CONFIG", errorCode: "QUEUE_DEFINED_TWICE", errorMessage:"Queue with Module[%s] and Name[%s] is defined more than once" },
		brokerConfig_QueueNameInvalid: { errorCategory:"CONFIG", errorCode: "INVALID_QUEUE_NAME", errorMessage:"Queue name[%s] is invalid. Queue names (case-insensitive) can only be 15 characters and contain only characters A-Z or 1-9" },
		brokerConfig_UnknownError: { errorCategory:"CONFIG", errorCode: "UNKNOWN_ERROR", errorMessage:"An unknown error occurred:[%s]" },
		queueInit_ErrorLoadingQueuesList: { errorCategory:"QUEUE", errorCode: "ERROR_LOADING_QUEUE_LIST", errorMessage:"Could not load list of queues - %s" },
		queueInit_ErrorCreatingQueue: { errorCategory:"QUEUE", errorCode: "ERROR_CREATING_QUEUE", errorMessage:"Could not create queue[%s] - %s" },
		queueInit_ErrorCreatingQueueUnexpectedResponse: { errorCategory:"QUEUE", errorCode: "UNEXPECTED_RESPONSE_FROM_SERVER", errorMessage:"Could not create queue[%s] - Response: %s" },
		queueReceive_ErrorReceivingMessage: { errorCategory:"QUEUE", errorCode: "ERROR_RECEIVING_MESSAGE", errorMessage:"Could not receive message queue[%s] - Error: %s" },
		queuePush_FailedToInitialize: { errorCategory:"QUEUE", errorCode: "PUSH_QUEUE_NOT_INITIALIZED", errorMessage:"Could not initialize queue" },
		queuePush_PushError: { errorCategory:"QUEUE", errorCode: "PUSH_ERROR", errorMessage:"Unexpected error: %s" },
		queueInvisibilityTimeout_FailedToInitialize: { errorCategory:"QUEUE", errorCode: "VISIBILITY_TIMEOUT_QUEUE_NOT_INITIALIZED", errorMessage:"Could not initialize queue" },
		queueInvisibilityTimeout_SetError: { errorCategory:"QUEUE", errorCode: "VISIBILITY_TIMEOUT_UNKNOWN_ERROR", errorMessage:"Unexpected error: %s" },
		queueDelete_FailedToInitialize: { errorCategory:"QUEUE", errorCode: "DELETE_INITIALIZATION_FAILURE", errorMessage:"Could not initialize queue" },
		queueDelete_DeleteError: { errorCategory:"QUEUE", errorCode: "DELETE_ERROR", errorMessage:"Unexpected error: %s" },
		queueEnsureEmpty_QueueDeleteError: { errorCategory:"QUEUE", errorCode: "ENSURE_EMPTY_QUEUE_DELETE_ERROR", errorMessage:"Unexpected error: %s" },
		queueEnsureEmpty_FailedToInitialize: { errorCategory:"QUEUE", errorCode: "ENSURE_EMPTY_INITIALIZATION_FAILURE", errorMessage:"Could not initialize queue" },
		queuePushMany_TooManyMessages: { errorCategory:"QUEUE", errorCode: "PUSH_MANY_TOO_MANY_MESSAGES", errorMessage:"Too many messages" },
		queuePushMany_IncompatibleJobTypes: { errorCategory:"QUEUE", errorCode: "PUSH_MANY_INCOMPATIBLE_JOB_TYPES", errorMessage:"pushMany() can only be used to push messages of the same jobType" },
		queuePushMany_TooManyQueues: { errorCategory:"QUEUE", errorCode: "PUSH_MANY_TOO_MANY_QUEUES", errorMessage:"pushMany() can only be used for a jobType registered for a single queue" },
		queuePushMany_AlreadyPushing: { errorCategory:"QUEUE", errorCode: "PUSH_MANY_ALREADY_PUSHING", errorMessage:"pushMany() already in progress for jobType[%s]. Please wait for queue-pushmany-completed event before calling pushMany() again." },
		workerWork_UnexpectedError: { errorCategory:"WORKER", errorCode: "UNEXPECTED_ERROR", errorMessage:"Unexpected error occurred while calling worker.work - %s" }
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