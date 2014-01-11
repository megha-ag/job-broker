job-broker
==========

A nodejs job broker module that allows AQMP style fanout queuing to Redis or SQS. It also allows you to create workers to process jobs from queues.


Configuration Based
-------------------
job-broker is configuration based and allows you to load multiple instances of queues and workers associated with a jobType.