define(["lib/jquery-1.8.2", "bar-chart"], function ($, plot) {

    $("button[title='Submit']").on("click", function(event) {
        var query = { expr: $("textarea").val() };
        $.get("http://localhost:3000/repl", query, function(objStr) {
            alert(objStr);
        });
    });

    $("button[title='Step over']").on("click", function(event) {
        $.post("http://localhost:3000/step/over");
    });

    $("button[title='Step in']").on("click", function(event) {
        $.post("http://localhost:3000/step/in");
    });

    $("button[title='Step out']").on("click", function(event) {
        $.post("http://localhost:3000/step/out");
    });

    plot.initialPlot();
    plot.update();

});
