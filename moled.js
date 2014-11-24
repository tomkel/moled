(function () {
    var width = 500,
        height = 500;

    var nodes = [{id: 'C'}, {id: 'H'}],
        links = [{source: 0, target: 1}],
        node = null,
        link = null;

    var force = d3.layout.force()
        .size([width, height])
        .nodes(nodes)
        .links(links)
        .linkDistance(50)
        .on('tick', function() {
          link.attr("x1", function(d) { return d.source.x; })
              .attr("y1", function(d) { return d.source.y; })
              .attr("x2", function(d) { return d.target.x; })
              .attr("y2", function(d) { return d.target.y; });

          node.attr("cx", function(d) { return d.x; })
              .attr("cy", function(d) { return d.y; });
        })
        .start();

    var svg = d3.select('body')
        .append('svg:svg')
        .attr('width', width)
        .attr('height', height)
        .attr('pointer-events', 'all')
        .on("mousemove", mousemove)
        .on("mousedown", mousedown)
        .on("mouseup", mouseup);

    var drag_line = svg.append('line')
        .attr('id', 'drag_line')
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 0)
        .attr("y2", 0);

        d3.select('#drag_line')

    draw();






    
    function draw() {
        link = svg.selectAll("line")
             .data(links)
           .enter().append("line");

        node = svg.selectAll("circle")
            .data(nodes)
          .enter().append("circle")
            .attr("r", 10);   
            //.text(function(d) {return d.id || 'X' ;});

        force.start();
    }


    function mousedown(event) {
        
    }

    function mousemove(event) {
        
    }

    function mouseup(event) {
        var mouse = d3.mouse(this);
        newnode = {x: mouse[0], y:mouse[1]};
        nodes.push(newnode);
        links.push({source:nodes[0], target:newnode});
        draw();
    }


})();
