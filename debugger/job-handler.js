var JOB = require('./enum').JOB,
    TASK = require('./enum').TASK;

var JobHandler = function(browserInterface) {
    // singleton pattern
    if (arguments.callee._singletonInstance)
        return arguments.callee._singletonInstance;

    arguments.callee._singletonInstance = this;
    this.browserInterface = browserInterface;

    // Allocate default tasks for new job and try to handle them
    this.handle = function(job, taskBag) {
        var name = job.name,
            browserInterface = this.browserInterface;

        // allocate initial tasks
        taskBag.add(name, 1);
        // if (name.match(/^step/) || name === 'continue')
        if (name.match(/^step/)) {
            taskBag.add(TASK.REQUIRE_SOURCE, 1);
            this.browserInterface.getExprList().forEach(function(expr) {
                taskBag.add(expr, 1);
            });
        }

        // TODO: handle all jobs
        switch (name) {
            case JOB.STEP_IN:
                browserInterface.in(function() {
                    browserInterface.finishTask(name);
                });
                break;
            case JOB.STEP_OVER:
                browserInterface.over(function() {
                    browserInterface.finishTask(name);
                });
                break;
            case JOB.STEP_OUT:
                browserInterface.out(function() {
                    browserInterface.finishTask(name);
                });
                break;
            case JOB.REQUIRE_SOURCE:
                browserInterface.requireSource(function(source, currentLine) {
                    browserInterface.getSocket().emit('update source', {
                        source: source,
                        currentLine: currentLine
                    });
                    browserInterface.finishTask(name);
                });
                break;
            case JOB.NEW_EXPRESSION:
                var expr = job.data;
                browserInterface.addExpr(expr);
                browserInterface.finishTask(TASK.NEW_EXPRESSION);
                break;
            default:
                console.log('unknown job');
                break;
        }
    };
};

module.exports = JobHandler;
