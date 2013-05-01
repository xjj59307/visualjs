define(["lib/d3.v3"], function (d3) {

    var margin = { top: 20, right: 20, bottom: 30, left: 40 },
        width = 900 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    var x = d3.scale.ordinal()
        .rangeRoundBands([0, width], .1, 1);

    var y = d3.scale.linear()
        .range([height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");

    var svg = d3.select("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var data = [];
    for (var i = 0; i <= 25; ++i) {
        data.push({ id: i, value: Math.random() * 10 });
    }

    var initialPlot = function() {
        x.domain(data.map(function(d) { return d.id; }));
        y.domain([0, d3.max(data, function(d) { return d.value; })]);

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis);

        svg.selectAll(".bar")
            .data(data)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", function(d) { return x(d.id); })
            .attr("width", x.rangeBand())
            .attr("y", function(d) { return y(d.value); })
            .attr("height", function(d) { return height - y(d.value); });
    };

    // smooth animation for sorting
    var update = function () {
        // Copy-on-write since tweens are evaluated after a delay.
        var x0 = x.domain(data.sort(function(a, b) {
                return b.value - a.value;
            })
            .map(function(d) { return d.id; }))
            .copy();

        var transition = svg.transition().duration(200),
            delay = function(d, i) { return i * 100; };

        transition.selectAll(".bar")
            .delay(delay)
            .attr("x", function(d) { return x0(d.id); });

        transition.select(".x.axis")
            .call(xAxis)
            .selectAll("g")
            .delay(delay);
    };

    return {
        initialPlot: initialPlot,
        update: update
    };

});
