define(["lib/jquery-1.8.2"], function ($) {

    var query = { code: '({ name: "xu" })' };
    $.get("http://localhost:3000/repl", query, function(data) {
        alert(data);
    });

});
