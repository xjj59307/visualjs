define(["lib/jquery-1.8.2", "lib/socket.io", "bar-chart", "lib/ace/ace"], function ($, io, barChart, ace) {

    var socket = io.connect('http://localhost');

    // initialize editor
    var editor = ace.edit("editor");
    editor.getSession().setMode("ace/mode/javascript");
    editor.setReadOnly(true);
    
    // get code chunk from server
    socket.on("response-source", function(source) {
        editor.getSession().setValue(source);
        // editor.getSession().addGutterDecoration(1, "ace_breakpoint");
    });

    $("button[title='Submit']").on("click", function(event) {
        var query = { expr: $("textarea").val() };
        $.get("http://localhost:3000/eval", query, function(data) {
            barChart.plot(data);
        });
    });

    $("button[title='Step over']").on("click", function(event) {
        // $.post("http://localhost:3000/step/over");
        socket.emit("request-step", { action: "over" });
    });

    $("button[title='Step in']").on("click", function(event) {
        // $.post("http://localhost:3000/step/in");
        socket.emit("request-step", { action: "in" });
    });

    $("button[title='Step out']").on("click", function(event) {
        // $.post("http://localhost:3000/step/out");
        socket.emit("request-step", { action: "out" });
    });

    // get initial source
    socket.emit("request-source");

});
