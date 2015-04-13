(function () {
    var width = 500,
        height = 500;

    var currAtom = 'C',
        selectedNode = null;

    var nodes = [{id: 'C'}, {id: 'H'}],
        links = [{source: 0, target: 1}];

    var force = d3.layout.force()
        .size([width, height])
        .nodes(nodes)
        .links(links)
        .linkDistance(50)
        .charge(-200)
        .on('tick', tick)
        .start();

    var svg = d3.select('body')
        .append('svg:svg')
        .attr('width', width)
        .attr('height', height)
        .attr('pointer-events', 'all')
        .on("mousemove", mousemove)
        .on("mouseup", mouseup);

    var nodesSelection = svg.selectAll(".node"),
        linksSelection = svg.selectAll(".link");

    var dragLink = null,
        dragNode = null;

    var mouse = null; 

    draw();

    function tick() {
       
        // drag
        var a = d3.selectAll("circle").filter(function (d) { return dragNode === d; });
        if (!a.empty()) {
            a.datum(function(d) { d.x = mouse[0]; d.y = mouse[1]; return d; });
            force.resume();
        }

        // links
        linksSelection.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });
        
        // nodes
        d3.selectAll("circle").attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });
        d3.selectAll("text").attr("x", function(d) { return d.x; })
            .attr("y", function(d) { return d.y; });
        //nodesSelection//.attr("x", function(d) { return d.x; })
           // .attr("y", function(d) { return d.y; });
            //.attr("transform", function(d) { return "translate("+d.x+","+d.y+")"; });
    }

    
    function draw() {
        linksSelection = linksSelection.data(links);
        linksSelection.enter()
                .insert("line", ".node") // insert so that nodes stay on top
                .attr("class", "link");

        nodesSelection = nodesSelection.data(nodes);
        var nodesEnter = nodesSelection.enter()
            .append("g")
            .attr("class", "node");

        nodesSelection.append("circle")
                      .attr("r", 10)
                      .on("mousedown", mousedown);
        nodesSelection.append("text")
                      .text(function(d) {return d.id || 'X' ;})
                      .attr("pointer-events", "none")
                      .attr("dx", "-0em")
                      .attr("text-anchor", "middle")
                      .attr("dy", ".35em");
                      

        force.start();
    }


    function mousedown(event, d) {
        var mouse = d3.mouse(this);
        dragNode = {x: mouse[0], y: mouse[1], id: currAtom};
        nodes.push(dragNode);
        dragLink = {source: d, target: dragNode};
        links.push(dragLink);
        draw();
    }

    function mousemove(event) {
        mouse = d3.mouse(this);
    }

    function mouseup(event) {
        if (dragLink) {
            dragLink = null;
            dragNode = null;
        }
    }


})();
