define(["lib/jquery-1.8.2"], function ($) {

    $(":submit").on("click", function(event) {
        // assure the query expression within (), like "({ some: 'json' })"
        var query = { expr: "(" + $("textarea").val() + ")" };
        $.get("http://localhost:3000/repl", query, function(objStr) {
            alert(objStr);
        });
    });

});
