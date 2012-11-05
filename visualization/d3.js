var dataset = [];
for (var i = 0; i < 100; i ++) {
    var number = Math.random() * 30;
    dataset.push(number);
}

var w = 500;
var h = 100;
var barPadding = 1;
var svg = d3.select("body")
        .append("svg")
        .attr("width", w)
        .attr("height", h);

svg.selectAll("rect")
    .data(dataset)
    .enter()
    .append("rect")
    .attr("x", function(d, i) {
        return i * (w / dataset.length)
    })
    .attr("y", function(d) {
        return h - d;
    })
    .attr("width", w / dataset.length - barPadding)
    .attr("height", function(d) {
        return d * 4;
    })
    .attr("fill", "teal");

// d3.select("body") .selectAll("div")
// .data(dataset)
// .enter()
// .append("div")
// .attr("class", "bar")
// .style("height", function(d) {
//     var barHeight = d * 5;
//     return barHeight + "px";
// });
