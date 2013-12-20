define(["lib/jquery-1.8.2", "lib/socket.io", "tree", "lib/ace/ace"],
    function ($, io, tree, ace) {

  var socket = io.connect('http://localhost');
  var nextJobSeq = 0;

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

  // get code chunk from server
  socket.on("update source", function(data) {
    editor.getSession().setValue(data.source);

    // delete last program counter
    // TODO: support multi-file
    if (!_.isUndefined(lastLine))
      editor.getSession().removeGutterDecoration(lastLine, "program-counter");
    lastLine = data.currentLine;

    // add new program counter
    editor.scrollToLine(data.currentLine + 1, true, true);
    editor.getSession().addGutterDecoration(
      data.currentLine, "program-counter");

    if (!_.isUndefined(lastMarker))
      editor.getSession().removeMarker(lastMarker);
    lastMarker = editor.getSession().addMarker(
      new Range(data.currentLine, 0, data.currentLine), 'warning', 'line');
  });

  // TODO: update multi-view
  socket.on("update view", function(data) {
    tree.plot(data);
  });

  $("button[title='submit']").on("click", function(event) {
    var expr = $("input").val();
    // evaluate empty expression will contribute to exception from v8
    if (!expr) return;

    emitNewJob("new expression", expr);
  });

  $("button[title='Step in']").on("click", function(event) {
    emitNewJob("step in");
  });

  $("button[title='Step over']").on("click", function(event) {
    emitNewJob("step over");
  });

  $("button[title='Step out']").on("click", function(event) {
    emitNewJob("step out");
  });

  // get initial source
  emitNewJob("require source");

});
