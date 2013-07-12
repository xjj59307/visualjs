define(["lib/jquery-1.8.2", "lib/socket.io", "bar-chart", "lib/ace/ace"], function ($, io, barChart, ace) {

    var socket = io.connect('http://localhost');
    var lastLine;

    // initialize editor
    var editor = ace.edit("editor");
    editor.getSession().setMode("ace/mode/javascript");
    editor.setReadOnly(true);

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

    socket.on("update view", function() {
        updateView();
    });

    var updateView = function() {
        var query = { expr: $("textarea").val() };
        $.get("http://localhost:3000/eval", query, function(data) {
            barChart.plot(data);
        });
    };

    $("button[title='Step over']").on("click", function(event) {
        // $.post("http://localhost:3000/step/over");
        socket.emit("step through", { action: "over" });
    });

    $("button[title='Step in']").on("click", function(event) {
        // $.post("http://localhost:3000/step/in");
        socket.emit("step through", { action: "in" });
    });

    $("button[title='Step out']").on("click", function(event) {
        // $.post("http://localhost:3000/step/out");
        socket.emit("step through", { action: "out" });
    });

    // get initial source
    socket.emit("require source");

});
