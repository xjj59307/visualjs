define(["lib/jquery-1.8.2"], function ($) {

    var json = JSON.stringify({ name: "xu" });
    var query = { code: json };
    $.get("http://localhost:3000/repl", query, function(data) {
        alert(data);
    });

});
