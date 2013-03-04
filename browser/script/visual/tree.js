define(["lib/d3.v3"], function (d3) {

    debugger;

    var margin = [20, 120, 20, 120],
        weight = 1280 - margin[1] - margin[3],
        height = 800 - margin[0] - margin[2],
        index = 0;

    var tree = d3.layout.tree().size([height, weight]);

    var diagonal = d3.svg.diagonal().projection(function(d) {
        return [d.x, d.y];
    });

    var svg = d3.select("#body").append("svg:svg")
        .attr("width", weight + margin[1] + margin[3])
        .attr("height", height + margin[0] + margin[2])
        .append("svg:g")
        .attr("transform", "translate(" + margin[0] + "," + margin[3] + ")");

    var json = {
        value: "1",
        children: [
            { value: "2" },
            { value: "3" }
        ]
    };
    var root = json;
    root.x0 = 0;
    root.y0 = 0;

    update(root);

    function update(source) {
        var duration = d3.event && d3.event.altKey ? 5000 : 500;

        // Compute the new tree layout
        var nodes = tree.nodes(root);

        // Normalize for fixed-depth
        nodes.forEach(function(d) {
            d.y = d.depth * 180;
        });

        // Update the nodes
        var node = svg.selectAll("g.node")
            .data(nodes, function(d) {
                return d.id || (d.id = ++index);
            });

        // Enter any new nodes at the parent's previous position
        var nodeEnter = node.enter().append("svg:g")
            .attr("class", "node")
            .attr("transform", function(d) {
                return "translate(" + source.x0 + "," + source.y0 + ")";
            })
            .on("click", function(d) {
                toggle(d);
                update(d);
            });

        nodeEnter.append("svg:circle")
            .attr("r", 1e-6)
            .style("fill", function(d) {
                return d._children ? "lightsteelblue" : "#fff";
            });

        nodeEnter.append("svg:text")
            .attr("y", function(d) {
                return d.children || d._children ? -10 : 15;
            })
            .attr("dx", "-.3em")
            .attr("text-anchor", function(d) {
                d.children || d._children ? "end": "start";
            })
            .text(function(d) {
                return d.value;
            })
            .style("fill-opacity", 1e-6);

        // Transition nodes to their new position
        var nodeUpdate = node.transition()
            .duration(duration)
            .attr("transform", function(d) {
                return "translate(" + d.x + "," + d.y + ")";
            });

        nodeUpdate.select("circle")
            .attr("r", 4.5)
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

        nodeExit.select("circle")
            .attr("r", 1e-6);

        nodeExit.select("text")
            .attr("fill-opacity", 1e-6);

        // Update the links
        var link = svg.selectAll("path.link")
            .data(tree.links(nodes), function(d) {
                return d.target.id;
            });

        // Enter any new links at the parent's previous position
        link.enter().insert("svg:path", "g")
            .attr("class", "link")
            .attr("d", function(d) {
                var object = {
                    x: source.x0,
                    y: source.y0
                };
                return diagonal({
                    source: object,
                    target: object
                });
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
                var object = {
                    x: source.x,
                    y: source.y
                };
                return diagonal({
                    source: object,
                    target: object
                });
            })
            .remove();

        nodes.forEach(function(d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    };

    function toggle(d) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else {
            d.children = d._children;
            d._children = null;
        }
    };

});