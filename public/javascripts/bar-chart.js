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

  var convert = function(visualNodes) {
    _.each(visualNodes, function(visualNode) {
      visualNode.value = visualNode.attributes.value;
      delete visualNode.attributes;
      delete visualNode.name;
      delete visualNode.type;
    });

    return visualNodes; 
  };

  var getKey = function(bar) {
    return _.has(bar, 'handle') ? bar.handle : bar.id;
  };

  var plot = function(visualNodes, handles) {
    if (!visualNodes) return;

    update(convert(visualNodes), handles);
  };

  // Highlight nodes related to objects being watched
  var highlight = function(handles) {
    var transition = svg.transition().duration(500);

    transition.selectAll(".bar")
      .attr("x", function(d) { return x(d.id); })
      .attr("width", x.rangeBand())
      .attr("y", function(d) { return y(d.value); })
      .attr("height", function(d) { return height - y(d.value); })
      .style("stroke", function() { return "darkgreen"; })
      .style("stroke-width", function() { return 1.5; });

    transition.selectAll(".bar")
      .filter(function(d) {
        return _.find(handles, function(handle) {
          return handle === d.handle;
        });
      })
      .style("stroke", function() { return "red"; })
      .style("stroke-width", function() { return 3.5; });
  };

  var update = function(data, handles) {
    x.domain(data.map(function(d) { return d.id; }));
    y.domain([0, d3.max(data, function(d) { return d.value; })]);

    if (svg.selectAll(".axis")[0].length === 0) {
      svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

      svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);
    }

    svg.selectAll(".bar")
      .data(data, function(d) { return getKey(d); })
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d) { return x(d.id); })
      .attr("y", function(d) { return y(d.value); })
      .style("stroke", function() { return "darkgreen"; })
      .style("stroke-width", function() { return 1.5; });

    var transition = svg.transition().duration(500);

    transition.selectAll(".bar")
      .attr("x", function(d) { return x(d.id); })
      .attr("width", x.rangeBand())
      .attr("y", function(d) { return y(d.value); })
      .attr("height", function(d) { return height - y(d.value); })
      .style("stroke", function() { return "darkgreen"; })
      .style("stroke-width", function() { return 1.5; });

    // Highlight nodes related to objects being watched
    transition.selectAll(".bar")
      .filter(function(d) {
        return _.find(handles, function(handle) {
          return handle === d.handle;
        });
      })
      .style("stroke", function() { return "red"; })
      .style("stroke-width", function() { return 3.5; });

    transition.select(".x.axis")
      .call(xAxis)
      .selectAll("g");

    transition.select(".y.axis")
      .call(yAxis)
      .selectAll("g");
  };

  return { plot: plot, highlight: highlight };

});
