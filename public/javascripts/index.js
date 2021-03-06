define(["lib/jquery-1.8.2", "lib/socket.io", "tree", "bar-chart", "lib/ace/ace",
       "lib/jquery.terminal-0.8.7", "lib/jquery.mousewheel"],
       function ($, io, tree, barChart, ace) {
  var socket = io.connect('http://localhost');
  var nextJobSeq = 0;
  var animatorType;

  var emitNewJob = function(name, data) {
    var job = { name: name, seq: nextJobSeq++, data: data };
    socket.emit("new job", job);
  };

  // initialize editor
  var editor = ace.edit("editor");
  var Range = ace.require('./range').Range;
  editor.getSession().setMode("ace/mode/javascript");
  editor.setReadOnly(true);
  editor.setHighlightActiveLine(false);
  editor.setHighlightGutterLine(false);
  var lastLine;
  var lastMarker;

  // handle mousedown event to (re)set breakpoint
  editor.on("guttermousedown", function(e){ 
    var target = e.domEvent.target; 
    var row = e.getDocumentPosition().row;

    if (target.className.indexOf("ace_gutter-cell") === -1) return; 

    if (target.className.indexOf("program-counter") == -1)
      emitNewJob("set breakpoint", row);
    else
      emitNewJob("clear breakpoint", row);

    e.stop();
  }); 

  var terminal = $('#terminal').terminal(function(command, term) {
    emitNewJob('evaluate', command);
    term.pause();
  }, { greetings: '', prompt: '> '});

  socket.on('evaluate', function(object) {
    // terminal.echo("[[;#0066CC;]" + JSON.stringify(object, null, "  ") + "]");
    terminal.echo(JSON.stringify(object, null, "  "));
    terminal.resume();
  });

  socket.on("set breakpoint", function(data) { 
    if (typeof data === 'number')
      editor.getSession().addGutterDecoration(data, "program-counter");
    else
      alert(data);
  });

  socket.on("clear breakpoint", function(data) { 
    if (typeof data === 'number')
      editor.getSession().removeGutterDecoration(data, "program-counter");
    else
      alert(data);
  });

  // get code chunk from server
  socket.on("update source", function(data) {
    editor.getSession().setValue(data.source);
    lastLine = data.currentLine;

    editor.scrollToLine(data.currentLine + 1, true, true);

    if (!_.isUndefined(lastMarker))
      editor.getSession().removeMarker(lastMarker);
    lastMarker = editor.getSession().addMarker(
      new Range(data.currentLine, 0, data.currentLine), 'warning', 'line');
  });

  socket.on("update view", function(err, visualNodes, handles) {
    if (err) { alert(err); return; }

    animatorType = visualNodes[0].type;
    if (_.isUndefined(animatorType)) return;

    if (animatorType === 'bar') barChart.plot(visualNodes, handles);
    else tree.plot(visualNodes, handles);
  });

  socket.on("highlight", function(handles) {
    if (_.isUndefined(animatorType)) return;

    if (animatorType === 'bar') barChart.highlight(handles);
    else tree.highlight(handles);
  });

  $(".visualize-div > button").on("click", function(event) {
    var expr = $("input[placeholder='Visualize']").val();
    // evaluate empty expression will contribute to exception from v8
    if (!expr) return;

    var watch = $("input[placeholder='Watch']").val().trim().split(',');
    emitNewJob("new expression", { expr: expr, watch: watch });

    $("input[placeholder='Visualize']").val("");
  });

  $(".watch-red-div > button").on("click", function(event) {
    var expr = $("input[placeholder='Watch']").val();
    if (!expr) return;

    var watch = $("input[placeholder='Watch']").val().trim().split(',');
    emitNewJob("highlight", watch);
  });

  $("button[title='Run/Pause']").on("click", function(event) {
    var watch = $("input[placeholder='Watch']").val().trim().split(',');
    emitNewJob("run", watch);
  });

  $("button[title='Step in']").on("click", function(event) {
    var watch = $("input[placeholder='Watch']").val().trim().split(',');
    emitNewJob("step in", watch);
  });

  $("button[title='Step over']").on("click", function(event) {
    var watch = $("input[placeholder='Watch']").val().trim().split(',');
    emitNewJob("step over", watch);
  });

  $("button[title='Step out']").on("click", function(event) {
    var watch = $("input[placeholder='Watch']").val().trim().split(',');
    emitNewJob("step out", watch);
  });

  // get initial source
  emitNewJob("require source");

});
