var json = {
    nodes: [
        { name: 'A' },
        { name: 'B' },
        { name: 'C' },
        { name: 'D' }
    ],
    links: [
        { source: 'A', target: 'B' },
        { source: 'A', target: 'C' },
        { source: 'B', target: 'D' },
        { source: 'C', target: 'D' }
    ]
};

var svg = d3.select("body").append("svg").append("g")
    .attr('transform', 'translate(20, 20)');

// Build initial link elements - Build first so they are under the nodes
var links = svg.selectAll('line.link').data(json.links);
links.enter().append('line').attr('class', 'link').attr('stroke', '#000');

// Build initial node elements
var nodes = svg.selectAll('g.node').data(json.nodes);
nodes.enter().append('g').attr('class', 'node').append('circle').attr('r', 10).append('title').text(function(d) {
    return d.name;
});

// Store nodes in a hash by name
var nodesByName = {};
nodes.each(function(d) {
    nodesByName[d.name] = d;
});

// Convert link references to objects
links.each(function(link) {
    link.source = nodesByName[link.source];
    link.target = nodesByName[link.target];
    if (!link.source.links) {
        link.source.links = [];
    }
    link.source.links.push(link.target);
    if (!link.target.links) {
        link.target.links = [];
    }
    link.target.links.push(link.source);
});

// Compute positions based on distance from root
var setPosition = function(node, i, depth) {
    if (!depth) {
        depth = 0;
    }
    if (!node.x) {
        node.x = (i + 1) * 40;
        node.y = (depth + 1) * 40;
        if (depth <= 1) {
            node.links.forEach(function(d, i2) {
                setPosition(d, i2, depth + 1);
            });
        }
    }

};
nodes.each(setPosition);

// Update inserted elements with computed positions
nodes.attr('transform', function(d) {
    return 'translate(' + d.x + ', ' + d.y + ')';
});

links.attr('x1', function(d) {
    return d.source.x;
}).attr('y1', function(d) {
    return d.source.y;
}).attr('x2', function(d) {
    return d.target.x;
}).attr('y2', function(d) {
    return d.target.y;
});