job-broker
==========
[![Build Status](https://travis-ci.org/vchatterji/job-broker.png?branch=master)](https://travis-ci.org/vchatterji/job-broker) 

A nodejs job broker module that allows [AMQP](http://www.rabbitmq.com/tutorials/amqp-concepts.html) style fanout queuing to Redis or SQS. It also allows you to create workers to process jobs from queues.

```
This branch corresponds to version:
v0.0.6-pre

Note: Only branches that end with -rel are release branches. 
If the version shown above has -pre, then its a pre-release version.
```

Installation
------------
```javascript
npm install job-broker
```

Configuration Based
-------------------
job-broker is configuration based and allows you to load multiple instances of queues and workers associated with a jobType.

Queue Neutral
-------------
Comes bundled with ready-made queue modules for Redis (using RSMQ) and SQS (using AWS SDK). You can also write your own queue modules for other queues such as RabbitMQ or Azure Queue

Customizable Workers
--------------------
It is simple to write your own workers. Workers are nodejs modules and can be configured via a file. 

How to configure
----------------
You need to create a configuration file. The following snippet shows a sample
```javascript
{
	"workers": [
		{
			"job-type":"sendtweet",
			"worker": {
				"worker-module":"yourtweetworker.js",
				"worker-settings": {
					"key1":"value1",
					"key2":100
				}
			},
			"queue" : {
				"queue-module":"redisqueue",
				"queue-name":"yourqueue",
				"queue-settings": {
					"host":"127.0.0.1",
					"port":"6379",
					"ns":"rsmq",
					"polling-interval":3000,
					"invisibility-timeout":3600,
					"max-dequeue-count":3
				}
			}
		},
		{
			"job-type":"sendemail",
			"worker": {
				"worker-module":"youremailworker.js",
				"worker-settings": {
					"key1":"value1",
					"key2":100
				}
			},
			"queue" : {
				"queue-module":"sqsqueue",
				"queue-name":"yoursqsqueue",
				"queue-settings": {
					"polling-interval":20,
					"invisibility-timeout":3600,
					"aws-config-file":"aws.json",
					"max-dequeue-count":3,
					"delete-frequency-seconds":5
				}
			}
		}
	]
}
```

The sample above uses an SQS queue which defines an aws-config-file. This file contains your AWS settings. A sample file (aws.json in the example above) is shown below:

```javascript
{ 
	"accessKeyId": "YOUR-ACCESS-KEY-ID", 
	"secretAccessKey": "YOUR-SECRET-ACCESS-KEY-ID", 
	"region": "us-west-2" 
}
```

In the configuration shown, messages with type sendtweet will be pushed to the defined Redis queue. Messages of type sendemail will be pushed to the SQS queue.

A simple worker
---------------
The code below shows a simple asynchronous worker that just writes messages to the console.

```javascript
/* jslint node: true */
"use strict";

//Load the AbstractWorker definition
var AbstractWorker = require("job-broker").AbstractWorker;

exports.worker = function() {
	//Create instance (giving it a friendly name)
	var worker = new AbstractWorker("simpleworker");
	
	//Error codes (you should ideally define them in a module)
	//and share them across your workers for consistency
	var errorCode = {
		none: { errorCode:0, errorMessage:undefined  }
	};
	
	//Initialize
	worker.init = function(workerSettings) {
		//the worker-settings object (defined in config)
		//is passed here and thus
		//you may check for any required settings
		//and throw an error message using
		//worker.throwError("Your error message");
	};
	
	//A worker must call worker.processCallback(err, message);
	//once it is done with processing a messages
	function sendCallback(message) {
		console.log("Worker[simpleworker], QueueModule[" + worker.queue.moduleName + "], QueueName[" + worker.queue.queueName + "] - Message processed:");
		console.log(JSON.stringify(message));
		worker.processCallback(errorCode.none, message);
	}
	
	//Process the message asynchronously
	worker.work = function(message) {	
		console.log("Worker[simpleworker], QueueModule[" + worker.queue.moduleName + "], QueueName[" + worker.queue.queueName + "] - Work called for message:");
		console.log(JSON.stringify(message));
		//You would invoke you asynchronous function here
		setTimeout(function() { sendCallback(message) }, 0);
	};
	
	return worker;
};
```

Configuration Constraints
-------------------------
- One job type can be pushed to multiple queues (SQS or Redis), just add same jobType in the array more than once.
  * `JobType1`, `Worker-Any`, `Q1`
  * `JobType1`, `Worker-Any`, `Q2`

In the example above, message with job-type `JobType1` will be pushed to both `Q1` and `Q2`. `Q1` and `Q2` can be either Redis or SQS queues.
- A particular queue (with specified type Redis/SQS and name queue-name) can only be associated with one `jobType`. The reason why this is disallowed is because if `W1` already processed the message from `Q1`, `W2` would never get the message. Similarly if `W2` processed the message, `W1` would never get the message. Since Node is not multi-threaded, such a configuration does not make sense.
i.e.
  * `JobType-Any`, `Worker-Any`, `Q1`
  * `JobType-Any`, `Worker-Any`, `Q1`

is not allowed
- Queue names can be 1-15 characters in length and must only consist of `[a-z0-9]` case insensitive.

Flow of message processing
--------------------------
1. Broker registers to be notified when the queue has messages to process.
2. When broker gets notified of a new message, then:
  * Broker sets the visibility timeout of the message as specified in the config
  * During invisibility timeout, the same message will not be notified to any queue listener
  * The broker passes the message to a worker
  * Once the workers callback that the message is processed, broker deletes the message
  * If workers fail, the message will be notified to the broker again after the invisibility timeout

Structure of a message
----------------------
```javascript
{
	id: String
	jobType: String
	payload: Object
}
```

The `id` of the message is not specified when it is pushed to the queue. After the object is successfully pushed to the queue, the message returned in the `queue-success` event will have the `id` populated.

The `id` will also be populated when messages are read from the queue and processed by workers.

Broker Interface
----------------
The broker provides the following functions:

1. `push(message)` - This pushes the message to one or more queues depending on `jobType` specified in the message.
2. `pushMany(messages)` - This pushes an array of messages to a single queue. All the messages in the array must have one `jobType` and that `jobType` must correspond to a single queue. This method can only be invoked once. The invoker must listen for the `queue-pushmany-completed` event before pushing the next set of messages.
3. `schedule(message, when)` - This pushes a message to one or more queues, but messages will only be processed after the delay (in seconds) specified by `when`. The delay is counted from the present time.
4. `connect()` - This is the first function that should be called by a script using the broker. This call will result in a `queue-ready` event once a particular queue is ready. The worker and the queue are passed as arguments (in that order) for the `queue-ready` event. A script using the broker can then ask the queue to start listening for messages by calling `queue.start()`.
5. `stop()` - This stops the message processing cycle for all queues.

Broker Events
-------------
A script using the broker can register for certain events. The following is a list of events raised by the broker:
* `queue-ready` - This event is raised when the queue is ready to start processing messages. The `worker` and `queue` are passed in this event (in that order), thus the script using the broker can call `queue.start()` to start listening for messages.
* `queue-started` - This event is raised when the queue has started listening for messages. The `worker` and `queue` are passed as arguments (in that order).
* `queue-stopped` - This event is raised when a queue has stopped listening for messages. The `worker` and the `queue` are passed as arguments (in that order).
* `queue-error` - This event is raised when there is an error as a result of a queue operation
* `queue-success` - This event is raised when a message was successfully queued. Please note that if a `jobType` has multiple queues registered, then this event will be raised multiple times (one time per queue)
* `work-completed` - This event is raised when a consumer signals that it is done processing the message
* `work-error` - This event is raised when a consumer signals that it failed in processing the message
* `queue-deleted` - This event is raised after a message is deleted
* `queue-poison` - This event is raised when a message that has been dequeued too many times is automatically deleted
* `queue-pushmany-completed` - This event signals that the `pushMany` call has completed and the script that is using the broker can now push another batch of messages. A report on the messages that were pushed to the queue is passed through this event. The structure of the report is documented next.
* `broker-initialized` - After a call to `broker.connect()`. This event is raised when all the queues registered with the broker initialized.
* `broker-started` - After a call to `broker.start()`. This event is raised when all the queues that are registered with the broker are now listening for messages.
* `broker-stopped` - After a call to `broker.stop()`. This event is raised when all the queues that were listening for messages are no longer listening for messages.


Structure of a broker event notification
----------------------------------------
```javascript
{
	"workerNumber":1,
	"worker":{ The worker object },
	"queue":{ The queue object },
	"message":{
		"id":"2323ab322ced",
		"jobType":"sendsms",
		"payload":{ "somekey":"someval" }
	}
	"error": {
		"errorCode":2002,
		"errorMessage":"There was an error queuing the message"
		"queueError":{ Object with a queue specific error if any }
		"workerError":{ Object with a worker specific error if any }
	}
}
```

This does not apply to these events: `queue-ready`, `queue-started`, `queue-stopped`, `broker-initialized`, `broker-started`, and `broker-stopped`

Structure of the report object resulting from a pushMany call
-------------------------------------------------------------
After a pushMany call finishes, the `queue-pushmany-completed` event is raised which passes a `report` object indicating the status of individual messages. The structure of the `report` object is shown below:
```javascript
{
	successes:[
		{
			id:"id of the first message pushed",
			jobType:"sendemail",
			payload:{ your fancy payload object }
		},
		{
			id:"id of the second message pushed",
			jobType:"sendemail",
			payload:{ your fancy payload object }
		}
	],
	failures:[
		{
			message: {
				jobType:"sendemail",
				payload:{ your fancy payload object of the third message that failed }
			},
			error: {
				errorCode:2005,
				errorMessage:"Unexpected error: Some error message",
				queueError: { Queue specific error. See sqsqueue.js and redisqueue.js }
			}
		}
	]
}
```

Sample code that listens for messages
-------------------------------------
```javascript
/* jslint node: true */
"use strict";
var path = require("path");
var brokerModule = require("job-broker");

var numProcessed = 0;

var broker = new brokerModule.JobBroker();

broker.load("broker.json", function(result, brokerObj) {
	if(result.errorCode) {
		console.log("Oops:" + result.errorMessage);
	}
	else {
		brokerObj.on("work-error", function(err, message) {
			numProcessed++;
			console.log("Error while processing message[" + numProcessed + "]:");
			console.log(message);
			console.log(err);
		});
		
		brokerObj.on("work-completed", function(err, message) {
			numProcessed++;
			console.log("Work completed for message[" + numProcessed + "]:");
			//console.log(message);
			//console.log(err);
		});
		
		brokerObj.on("queue-poison", function(err, message) {
			numProcessed++;
			console.log("Poison message will be deleted - message[" + numProcessed + "]:");
		});
		
		brokerObj.on("queue-error", function(err, message) {
			console.log("----------------- Queue Error -----------------");
			console.log(err);
			console.log("--------------- End Queue Error ---------------");
		});
		
		brokerObj.on("queue-deleted", function(err, message) {
			//console.log("Message deleted - message[" + message + "]:");
		});
		
		brokerObj.on("queue-ready", function(worker, queue) {
			//Tell the queue to start listening for messages
			queue.start();
			//Sample commented code to push a message
			//brokerObj.push({ 
			//	jobType: "sendemail", 
			//	payload: { 
			//		some:"fancy",
			//		obj:"val"
			//	} 
			//});
		});
		
		//Connect to queue creating the queue if necessary
		brokerObj.connect();
	}
});

process.on('uncaughtException', function (err) {
  console.log('Caught exception: ' + err);
});
```

Pushing messages in batches
---------------------------
Pushing messages in batches makes sense for SQS as we want to avoid additional RTTs to SQS. The following code shows how to accomplish this. To run the code, pass in the number of messages you would like to push from the command line:
```
node producer.js 100
```

The code for producer.js is listed below:
```javascript
/* jslint node: true */
"use strict";
var path = require("path");
var brokerModule = require("job-broker");
var broker;

var counter = 0;
var messagesToProduce;
if(process.argv && process.argv[2] && !isNaN(parseInt(process.argv[2]))) {
	messagesToProduce = parseInt(process.argv[2]);
}
else {
	messagesToProduce = 100;
}

console.log("I will produce " + messagesToProduce + " messages.");

var producedSoFar = 0;

function produce() {
	var messages = [];
	
	//batch size for AWS is max 10
	for(var i=0; i<10; i++) {
		var message = {};
		message.jobType = "sendemail";
		message.payload = {};
		message.payload.from = "me@sent.ly";
		message.payload.to = "you@gmail.com";
		message.payload.text = "";

		if(producedSoFar < messagesToProduce) {
			message.payload.text = "Message " + (producedSoFar + 1) + " intime: " + (new Date()).toTimeString().split(' ')[0];
			messages.push(message);
			producedSoFar++;
		}
		else {
			break;
		}
	}
	
	if(messages.length > 0) {
		broker.pushMany(messages);
	}
	else {
		console.log("pushMany calls have finished!");
	}
}

var numQueueAlerts = 0;

var jobBroker = new brokerModule.JobBroker();

jobBroker.load("broker.json", function(result, brokerObj) {
	if(result.errorCode) {
		console.log("Oops:" + result.errorMessage);
		console.log(result);
	}
	else {
		broker = brokerObj;
		broker.on("queue-error", function(err, msg) {
			console.log("ERROR:");
			console.log(err);
			console.log(msg);
		});
		
		broker.on("queue-success", function(err, msg) {
			numQueueAlerts++;
			console.log("Queued so far:" + numQueueAlerts);
		});
		
		broker.on("queue-pushmany-completed", function(report) {
			console.log("----------- Batch completed -----------");
			console.log("Success cases:");
			console.log(JSON.stringify(report.successes));
			console.log("Failure cases:");
			console.log(JSON.stringify(report.failures));
			console.log("----------- Batch completed -----------");
			//Let's push more is needed
			produce();
		});
		
		
		broker.on("broker-initialized", function() {
			//All queues are ready, let's start producing messages
			produce();
		});
		
		//Initialize all queues
		broker.connect();
	}
});

process.on('uncaughtException', function (err) {
  console.log('Caught exception: ' + err);
});
```

Producer only configuration
---------------------------
It is a common use case for a Nodejs webapp or REST API to be producing messages and another Nodejs app to be consuming and processing them. In such a case, a worker definition is not required for the API/Web app since it will not be consuming messages. For example, in the configuration defined in the examples so far, if the sendemail message was being produced by a web app, then the web app should define the worker module as noworker. This configuration is shown below:
```javascript
{
	"workers": [
		{
			"job-type":"sendtweet",
			"worker": {
				"worker-module":"noworker"
			},
			"queue" : {
				"queue-module":"redisqueue",
				"queue-name":"yourqueue",
				"queue-settings": {
					"host":"127.0.0.1",
					"port":"6379",
					"ns":"rsmq",
					"polling-interval":3000,
					"invisibility-timeout":3600,
					"max-dequeue-count":3
				}
			}
		},
		{
			"job-type":"sendemail",
			"worker": {
				"worker-module":"noworker"
			},
			"queue" : {
				"queue-module":"sqsqueue",
				"queue-name":"yoursqsqueue",
				"queue-settings": {
					"polling-interval":20,
					"invisibility-timeout":3600,
					"aws-config-file":"aws.json",
					"max-dequeue-count":3,
					"delete-frequency-seconds":5
				}
			}
		}
	]
}
```

Thus, the web app/REST API shall only produce the messages and push them to the appropriate queues. The consumer Nodejs app will have the full configuration with a proper worker module defined which will do the actual work.


Unit Tests
----------
The project defines some unit tests (jasmine) that can be executed via grunt (linting, tests related to configuration errors).

Please help improve this module by adding more unit tests.

Performance
-----------
This code has been tested using Elasticache and SQS.
- Elasticache (Redis): Same zone on AWS with a memory optimized instance. 100k messages which result in a worker making an HTTP call to a server were processed in under 5 mins.
- SQS: Same zone on AWS with a memory optimized instance. 100k messages which result in a worker making an HTTP call to a server were processed in under 20 mins.
- Memory footprint is under 150MB for processing 100k messages.