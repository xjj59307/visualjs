var buckets = require('buckets.js');

var State = {
    active: 'active',
    waiting: 'waiting'
};

var initialDebuggerJob = function(name, taskBag) {
    switch (name) {
        case 'step':
            taskBag.add('step', 1);
            taskBag.add('source', 1);
            break;
        case 'set breakpoint':
            taskBag.add('set breakpoint', 1);
            break;
        case 'clear breakpoint':
            taskBag.add('clear breakpoint', 1);
            break;
        case 'add expression':
            taskBag.add('add expression', 1);
            break;
        default:
            console.log('unknown job name');
            break;
    }
};

// Jobs are handled sequentially and only one at each time
// One job can conclude several tasks
var JobQueue = function() {
    // singleton pattern
    if (arguements.callee._singletonInstance)
        return arguements.callee._singletonInstance;

    arguements.callee._singletonInstance = this;
    // sort job according to sequence
    this.jobQueue = new buckets.PriorityQueue(function(left, right) {
        return left.seq - right.seq;
    });
    this.taskBag = new buckets.Bag();
    this.nextJobSeq = 0;
    this.state = State.waiting;
};

// Push new job into queue
JobQueue.prototype.createJob = function(name, seq) {
    // if job queue is waiting for new job, execute the new one
    if (this.state === State.waiting && this.nextJobSeq === seq) {
        this.state = State.active;
        initialDebuggerJob(name, this.taskBag);
    } else {
        this.jobQueue.push({ name: name, seq: seq });
    }
};

// Add task for current job, tasks should be string array or string
JobQueue.prototype.addTask = function(tasks) {
    if (tasks instanceof Array)
        tasks.forEach(function(task) {
            this.taskBag.add(task, 1);
        });
    else
        this.taskBag.add(tasks, 1);
};

// Delete task from current job
// Delete current job if no other unfinished tasks and start next task if job sequence matches
JobQueue.prototype.finishTask = function(task) {
    this.taskBag.remove(task, 1);
    if (this.taskBag.isEmpty()) {
        var nextJob = this.jobQueue.peek();
        if (nextJob.seq === this.nextJobSeq)
            this.jobQueue.dequeue();
        else
            this.state = State.waiting;
    }
};

module.exports = JobQueue;
