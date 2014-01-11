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


Performance
-----------
This code has been tested using Elasticache and SQS.
- Elasticache (Redis): Same zone on AWS with a memory optimized instance. 100k messages which result in a worker making an HTTP call to a server were processed in under 5 mins.
- SQS: Same zone on AWS with a memory optimized instance. 100k messages which result in a worker making an HTTP call to a server were processed in under 20 mins.
- Memory footprint is under 150MB for processing 100k messages.