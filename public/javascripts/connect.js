define(["lib/jquery-1.8.2"], function ($) {

    $.get("http://localhost:3000/repl", {expr: "{name: "xu"}"}, function(data) {
        var data_object = JSON.parse(data);
    });

});
