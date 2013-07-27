var buckets = require('buckets'),
    STATE = require('./enum').STATE,
    util = require('util'),
    EventEmitter = require('events').EventEmitter;

// Jobs are handled sequentially and synchronously, and one job can conclude several tasks
var JobQueue = function() {
    // singleton pattern
    if (arguments.callee._singletonInstance)
        return arguments.callee._singletonInstance;

    arguments.callee._singletonInstance = this;
    // sort job according to sequence
    this.jobQueue = new buckets.PriorityQueue(function(left, right) {
        return left.seq - right.seq;
    });
    this.taskBag = new buckets.Bag();
    this.nextJobSeq = 0;
    this.state = STATE.WAITING;
};
util.inherits(JobQueue, EventEmitter);

// reset job queue when new socket created
JobQueue.prototype.reset = function() {
    this.nextJobSeq = 0;
};

// Push new job into queue
JobQueue.prototype.addJob = function(job) {
    // if job queue is waiting for new job, execute the new one
    if (this.state === STATE.WAITING && this.nextJobSeq === job.seq) {
        this.state = STATE.ACTIVE;
        // emit event to inform browser interface to handle this job
        this.emit(job.name, job);
    } else {
        this.jobQueue.add(job);
    }
};

JobQueue.prototype.addTask = function(task) {
    this.taskBag.add(task, 1);
};

// Delete current job if no other unfinished tasks and start next job if job sequence matches
JobQueue.prototype.finishTask = function(task) {
    this.taskBag.remove(task, 1);
    if (this.taskBag.isEmpty()) {
        this.nextJobSeq++;
        var nextJob = this.jobQueue.peek();

        if (nextJob && nextJob.seq === this.nextJobSeq) {
            var job = this.jobQueue.dequeue();
            // emit event to inform browser interface to handle this job
            this.emit(job.name, job);
        } else
            this.state = STATE.WAITING;
    }
};

module.exports = JobQueue;
