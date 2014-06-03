define(["lib/d3.v3", "lib/underscore"], function (d3, _) {

  var margin = { top: 20, right: 20, bottom: 30, left: 40 };
  var width = 1000 - margin.left - margin.right;
  var height = 750 - margin.top - margin.bottom;

  // ordinal.rangeBands(interval, padding, outerPadding)
  var x = d3.scale.ordinal()
    .rangeRoundBands([0, width], 0.3, 1);

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

  var initial = true;

  var convert = function(visualNodes) {
    _.each(visualNodes, function(visualNode) {
      visualNode.value = visualNode.attributes['value'];
      delete visualNode['attributes'];
      delete visualNode['name'];
      delete visualNode['type'];
    });

    return visualNodes; 
  };

  var getKey = function(bar) {
    return _.has(bar, 'handle') ? bar.handle : bar.id;
  };

  var plot = function(visualNodes) {
    if (!visualNodes) return;

    var bars = convert(visualNodes);

    if (initial === true) initialPlot(bars);
    else update(bars);
  };

  var initialPlot = function(data) {
    initial = false;

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
      .data(data, function(d) { return getKey(d); })
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d) { return x(d.id); })
      .attr("width", x.rangeBand())
      .attr("y", function(d) { return y(d.value); })
      .attr("height", function(d) { return height - y(d.value); });
  };

  // smooth animation for sorting
  var update = function (data) {
    x.domain(data.map(function(d) { return d.id; }));
    y.domain([0, d3.max(data, function(d) { return d.value; })]);

    svg.selectAll(".bar")
      .data(data, function(d) { return getKey(d); })
      .enter().append("rect")
      .attr("class", "bar");

    var transition = svg.transition().duration(500);
    var delay = function(d, i) { return i * 300; };

    transition.selectAll(".bar")
      .delay(delay)
      .attr("x", function(d) { return x(d.id); })
      .attr("width", x.rangeBand())
      .attr("y", function(d) { return y(d.value); })
      .attr("height", function(d) { return height - y(d.value); });

    transition.select(".x.axis")
      .call(xAxis)
      .selectAll("g")
      .delay(delay);

    transition.select(".y.axis")
      .call(yAxis)
      .selectAll("g")
      .delay(delay);
  };

  return { plot: plot };

});
