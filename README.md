job-broker
==========

A nodejs job broker module that allows AQMP style fanout queuing to Redis or SQS. It also allows you to create workers to process jobs from queues.

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
It is simple to write your own workers. Workers are nodejs modules and can be configured via a file. A sample worker can be found in src/workers/console-settings.js

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

Configuration Constraints
-------------------------
- One job type can be pushed to multiple queues (SQS or Redis), just add same jobType in the array more than once.
JobType1, Worker-Any, Q1
JobType1, Worker-Any, Q2
In the example above, message with job-type JobType1 will be pushed to both Q1 and Q2. Q1 and Q2 can be either Redis or SQS queues.
- A particular queue (with specified type Redis/SQS and name queue-name) can only be associated with one jobType. The reason why this is disallowed is because if W1 already processed the message from Q1, W2 would never get the message. Similarly if W2 processed the message, W1 would never get the message. Since Node is not multi-threaded, such a configuration does not make sense.
i.e.
JobType-Any, Worker-Any, Q1
JobType-Any, Worker-Any, Q1
is not allowed

Flow of message processing
--------------------------
1. Broker registers to be notified when the queue has messages to process.
2. When broker gets notified of a new message, then 
	Broker sets the visibility timeout of the message as specified in the config
	During invisibility timeout, the same message will not be notified to any queue listener
	The broker passes the message to a workers
	Once the workers callback that the message is processed, broker deletes the message
	If workers fail, the message will be notified to the broker again after the invisibility timeout

Performance
-----------
This code has been tested using Elasticache and SQS.
- Elasticache (Redis): Same zone on AWS with a memory optimized instance. 100k messages which result in a worker making an HTTP call to a server were processed in under 5 mins.
- SQS: Same zone on AWS with a memory optimized instance. 100k messages which result in a worker making an HTTP call to a server were processed in under 20 mins.
- Memory footprint is under 150MB for processing 100k messages.