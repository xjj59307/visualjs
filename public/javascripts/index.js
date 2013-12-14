define(["lib/jquery-1.8.2", "lib/socket.io", "bar-chart", "lib/ace/ace"],
    function ($, io, barChart, ace) {

  var socket = io.connect('http://localhost');
  var nextJobSeq = 0;

  var emitNewJob = function(name, data) {
    var job = { name: name, seq: nextJobSeq++, data: data };
    socket.emit("new job", job);
  };

  // initialize editor
  var editor = ace.edit("editor");
  editor.getSession().setMode("ace/mode/javascript");
  editor.setReadOnly(true);
  var lastLine;

  // get code chunk from server
  socket.on("update source", function(data) {
    editor.getSession().setValue(data.source);

    // delete last program counter
    // TODO: support multi-file
    if (lastLine !== undefined) editor.getSession().removeGutterDecoration(lastLine, "program-counter");
    lastLine = data.currentLine;

    // add new program counter
    // if (!editor.isFocused()) editor.focus();
    // editor.gotoLine(data.currentLine + 1);
    editor.scrollToLine(data.currentLine + 1, true, true);
    editor.getSession().addGutterDecoration(data.currentLine, "program-counter");
  });

  // TODO: update multi-view
  socket.on("update view", function(data) {
    barChart.plot(data.result);
  });

  $("button[title='submit']").on("click", function(event) {
    var expr = $("input").val();
    // evaluate empty expression will contribute to exception from v8
    if (!expr) return;

    emitNewJob("new expression", expr);
  });

  $("button[title='Step in']").on("click", function(event) {
    // $.post("http://localhost:3000/step/in");
    emitNewJob("step in");
  });

  $("button[title='Step over']").on("click", function(event) {
    // $.post("http://localhost:3000/step/over");
    emitNewJob("step over");
  });

  $("button[title='Step out']").on("click", function(event) {
    // $.post("http://localhost:3000/step/out");
    emitNewJob("step out");
  });

  // get initial source
  emitNewJob("require source");

});
