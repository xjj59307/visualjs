define(["lib/d3.v3", "lib/jquery-1.8.2", "lib/underscore"], function (d3, $, _) {

  var margin = { top: 20, right: 20, bottom: 30, left: 40 };
  var width = 1000 - margin.left - margin.right;
  var height = 800 - margin.top - margin.bottom;
  var index = 0;
  var treeSize = [800, 800];

  var tree = d3.layout.tree().size(treeSize);

  var diagonal = d3.svg.diagonal().projection(function(d) {
    return [d.x, d.y];
  });

  function onZoom() {
    var translate = "translate(" + d3.event.translate + ")";
    var scale = "scale(" + d3.event.scale + ")";
    svg.attr("transform", translate + " " + scale);
  }

  var svg = d3.select("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .call(d3.behavior.zoom().on("zoom", onZoom))
    .append("g");

  var convert = function(visualNodes) {
    var treeNodes = _.reduce(visualNodes, function(previous, current) {
      if (current.type === 'tree_node') {
        previous.push(current);
      } else if (_.has(current.attributes, 'from')) {
        var attributes = current.attributes;
        var from = visualNodes[attributes['from']];

        if (!_.has(from, 'children')) from.children = [];
        from.children.push(visualNodes[attributes['to']]);
      }

      return previous;
    }, []);

    _.each(treeNodes, function(treeNode, index) {
      treeNode.name = treeNode.attributes['label'];
      delete treeNode['type'];
      delete treeNode['attributes'];
    });

    return treeNodes;
  };

  var plot = function(visualNodes) {
    root = convert(visualNodes)[0];

    root.x0 = 0;
    root.y0 = 0;
    // Remove all nodes of last object.
    $('g.node, path.edge').remove();
    update(root);

    function update(source) {
      var duration = d3.event && d3.event.altKey ? 5000 : 500;

      // Compute the new tree layout
      var nodes = tree.nodes(root);

      // Normalize for fixed-depth
      nodes.forEach(function(d) { d.y = d.depth * 180; });

      // Update the nodes
      var node = svg.selectAll("g.node")
        .data(nodes, function(d) { return d.id; });

      // Enter any new nodes at the parent's previous position
      var nodeEnter = node.enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) {
          return "translate(" + source.x0 + "," + source.y0 + ")";
        })
        .on("click", function(d) {
          // Toggle children nodes.
          if (d.children) { d._children = d.children; d.children = null; }
          else { d.children = d._children; d._children = null; }

          update(d);
        });

      nodeEnter.append("rect")
        .attr("width", 1e-6)
        .attr("height", 1e-6)
        .style("fill", function(d) {
          return d._children ? "lightsteelblue" : "#fff";
        });

      var labels = nodeEnter.append("text")
        .attr("text-anchor", "middle")
        .attr("x", 0)
        .style("fill-opacity", 1e-6);

      labels.append("tspan")
        .attr("x", 0)
        .attr("dy", "0.5em")
        .text(function(d) {
          return d.name;
        });

      var nodePadding = 10;

      labels.each(function (d) {
        var bbox = this.getBBox();
        d.bbox = bbox;
        d.width = bbox.width + 2 * nodePadding;
        d.height = bbox.height + 2 * nodePadding;
      });

      // Transition nodes to their new position
      var nodeUpdate = node.transition()
        .duration(duration)
        .attr("transform", function(d) {
          return "translate(" + d.x + "," + d.y + ")";
        });

      nodeUpdate.select("rect")
        .attr("x", function (d) {
          return -(d.bbox.width / 2 + nodePadding);
        })
        .attr("y", function (d) {
          return -(d.bbox.height / 2 + nodePadding);
        })
        .attr("width", function(d) {
          return d.width;
        })
        .attr("height", function(d) {
          return d.height;
        })
        .style("fill", function(d) {
          return d._children ? "lightsteelblue" : "#fff";
        });

      nodeUpdate.select("text")
        .style("fill-opacity", 1);

      // Transition existing nodes to the parent's new position
      var nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", function(d) {
          return "translate(" + source.x0 + "," + source.y0 + ")";
        })
        .remove();

      nodeExit.select("rect")
        .attr("width", 1e-6)
        .attr("height", 1e-6);

      nodeExit.select("text")
        .attr("fill-opacity", 1e-6);

      // Update the links
      var link = svg.selectAll("path.edge")
        .data(tree.links(nodes), function(d) {
          return d.target.id;
        });

      // Enter any new links at the parent's previous position
      link.enter().insert("path", "g")
        .attr("class", "edge")
        .attr("d", function(d) {
          var object = { x: source.x0, y: source.y0 };
          return diagonal({ source: object, target: object });
        })
        .transition()
        .duration(duration)
        .attr("d", diagonal);

      // Transition links to their new position
      link.transition()
        .duration(duration)
        .attr("d", diagonal);

      link.exit().transition()
        .duration(duration)
        .attr("d", function(d) {
          var object = { x: source.x, y: source.y };
          return diagonal({ source: object, target: object });
        })
        .remove();

      nodes.forEach(function(d) { d.x0 = d.x; d.y0 = d.y; });
    }
  };

  return { plot: plot };

});
