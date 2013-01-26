require(["lib/d3.v3", "layout"], function (d3, layout) {

    var transitions = [
        { source: "CLOSED", target: "LISTEN" },
        { source: "LISTEN", target: "SYN RCVD" },
        { source: "LISTEN", target: "SYN SENT" },
        { source: "LISTEN", target: "CLOSED" },
        { source: "SYN RCVD", target: "FINWAIT-1" },
        { source: "SYN RCVD", target: "ESTAB" },
        { source: "SYN SENT", target: "SYN RCVD" },
        { source: "SYN SENT", target: "ESTAB" },
        { source: "SYN SENT", target: "CLOSED" },
        { source: "ESTAB", target: "FINWAIT-1" },
        { source: "ESTAB", target: "CLOSE WAIT" },
        { source: "FINWAIT-1", target: "FINWAIT-2" },
        { source: "FINWAIT-1", target: "CLOSING" },
        { source: "CLOSE WAIT", target: "LAST-ACK" },
        { source: "FINWAIT-2", target: "TIME WAIT" },
        { source: "CLOSING", target: "TIME WAIT" },
        { source: "LAST-ACK", target: "CLOSED" },
        { source: "TIME WAIT", target: "CLOSED" }
    ];

    var getSpline = function (edge) {
        var points = edge.content.points.slice();
        var source = {
            x: edge.source.content.x,
            y: edge.source.content.y
        };
        var target = {
            x: edge.target.content.x,
            y: edge.target.content.y
        };
        if (edge.source.content.rank < edge.target.content.rank) {
            source.y += edge.source.bbox.height;
            target.y -= edge.target.bbox.height;
        } else {
            source.y -= edge.source.bbox.height;
            target.y += edge.target.bbox.height;
        }

        points.unshift(source);
        points.push(target);

        return d3.svg.line()
            .x(function (d) { return d.x; })
            .y(function (d) { return d.y; })
            .interpolate("linear")
            (points);
    };

    // Get the data in the right format
    var stateKeys = {};
    transitions.forEach(function (edge) {
        var source = stateKeys[edge.source];
        var target = stateKeys[edge.target];
        if (!source) {
            source = stateKeys[edge.source] = { label: edge.source, edges: [] };
        }
        if (!target) {
            target = stateKeys[edge.target] = { label: edge.target, edges: [] };
        }
        source.edges.push(edge);
        target.edges.push(edge);
    });

    transitions.forEach(function (edge) {
        edge.source = stateKeys[edge.source];
        edge.target = stateKeys[edge.target];
    });

    // Now start layout things out
    var svg = d3.select("svg");
    var svgGroup = svg.append("g").attr("transform", "translate(5, 5)");

    var states = d3.values(stateKeys);
    var nodes = svgGroup
        .selectAll("g .node")
        .data(states)
        .enter()
            .append("g")
            .attr("class", "node")
            .attr("id", function (d) {
                return "node-" + d.label;
            });

    var edges = svgGroup
        .selectAll("path .edge")
        .data(transitions)
        .enter()
            .append("path")
            .attr("class", "edge")
            .attr("marker-end", "url(#arrowhead)");

    // Append rectangles to the nodes. We do this before laying out the text because we want to the text above the rectangle
    var rects = nodes.append("rect");

    // Append text
    var labels = nodes
        .append("text")
            .attr("text-anchor", "middle")
            .attr("x", 0);

    labels
        .append("tspan")
        .attr("x", 0)
        .attr("dy", "1em")
        .text(function (d) {
            return d.label;
        });


    var nodePadding = 10;

    // We need width and height for layout
    labels.each(function (d) {
        var bbox = this.getBBox();
        d.bbox = bbox;
        d.width = bbox.width + 2 * nodePadding;
        d.height = bbox.height + 2 * nodePadding;
    });

    rects
        .attr("x", function (d) {
            return -(d.bbox.width / 2 + nodePadding);
        })
        .attr("y", function (d) {
            return -(d.bbox.height / 2 + nodePadding);
        })
        .attr("width", function (d) {
            return d.width;
        })
        .attr("height", function (d) {
            return d.height;
        });

    labels
        .attr("x", function (d) {
            return -d.bbox.width / 2;
        })
        .attr("y", function (d) {
            return -d.bbox.height / 2;
        });

    // Create the layout and get the graph
    layout
        .nodeSep(50)
        .edgeSep(10)
        .rankSep(50)
        .nodes(states)
        .edges(transitions)
        .run();

    nodes.attr("transform", function (d) {
        return "translate(" + d.content.x + "," + d.content.y + ")";
    });

    // Ensure that we have at least two points between source and target
    edges.each(function (d) {
        var points = d.content.points;
        if (!points.length) {
            var source = d.source.content;
            var target = d.target.content;
            points.push({
                x: (source.x + target.x) / 2,
                y: (source.y + target.y) / 2
            });
        }

        if (points.length === 1) {
            points.push({
                x: points[0].x,
                y: points[0].y
            });
        }
    });

    // Set the id of the SVG element to have access to it later
    edges
        .attr("id", function (d) {
            return d.content.id;
        })
        .attr("d", function (d) {
           return getSpline(d);
        });

    var svgBBox = svg.node().getBBox();
    svg.attr("width", svgBBox.width + 10);
    svg.attr("height", svgBBox.height + 10);

});
