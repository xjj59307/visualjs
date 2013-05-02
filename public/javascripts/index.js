define(["lib/jquery-1.8.2", "lib/socket.io", "bar-chart"], function ($, io, barChart) {

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

});
