define(["lib/jquery-1.8.2", "lib/socket.io", "bar-chart", "lib/ace/ace"], function ($, io, barChart, ace) {

    var socket = io.connect('http://localhost');

    $("button[title='Submit']").on("click", function(event) {
        var query = { expr: $("textarea").val() };
        $.get("http://localhost:3000/repl", query, function(data) {
            barChart.plot(data);
        });
    });

    $("button[title='Step over']").on("click", function(event) {
        // $.post("http://localhost:3000/step/over");
        socket.emit("step", { action: "over" });
    });

    $("button[title='Step in']").on("click", function(event) {
        // $.post("http://localhost:3000/step/in");
        socket.emit("step", { action: "in" });
    });

    $("button[title='Step out']").on("click", function(event) {
        // $.post("http://localhost:3000/step/out");
        socket.emit("step", { action: "out" });
    });

    var code = "var x = 2;\nvar y = 2;"
    var editor = ace.edit("editor");
    editor.getSession().setMode("ace/mode/javascript");
    editor.setReadOnly(true);
    editor.getSession().setValue(code);
    editor.getSession().addGutterDecoration(1, "ace_breakpoint");

});
