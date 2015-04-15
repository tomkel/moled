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
        //.friction(0.1)
        .on('tick', tick)
        .start();

    var svg = d3.select('body')
        .append('svg:svg')
        .attr('width', width)
        .attr('height', height)
        .attr('pointer-events', 'all')
        .on("mousemove", mousemove)
        .on("mouseup", mouseup);
    
    d3.select(window).on("keydown", keydown);

    var nodesSelection = svg.selectAll(".node"),
        linksSelection = svg.selectAll(".link");

    var drag_line = null;

    var selectedNode = null,
        selectedLink = null;

    draw();

    function tick() {
       
        // links
        linksSelection.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });
        
        // nodes
        nodesSelection.selectAll("circle").attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });
        nodesSelection.selectAll("text").attr("x", function(d) { return d.x; })
            .attr("y", function(d) { return d.y; });
    }

    
    function draw() {

        linksSelection = linksSelection.data(links);
        linksSelection.enter()
            .insert("line", ".node") // insert so that nodes stay on top
            .attr("class", "link");

        linksSelection.exit()
            .remove();

        nodesSelection = nodesSelection.data(nodes, function(d) {return d.index;});
        var nodesEnter = nodesSelection.enter()
            .append("g")
            .attr("class", "node");

        nodesEnter.append("circle")
                      .attr("r", 8)
                      .on("mousedown", mousedown);
        nodesEnter.append("text")
                      .text(function(d) {return d.id || 'X' ;})
                      .attr("pointer-events", "none")
                      .attr("dx", "-0em")
                      .attr("text-anchor", "middle")
                      .attr("dy", ".35em");                      
        
        var nodesExit = nodesSelection.exit();
        nodesExit.remove();

        force.start();
    }


    function mousedown(d) {
        var mouse = d3.mouse(this);
        drag_line = svg.insert("line", ".node")
            .attr("class", "drag_line")
            .attr("x1", d.x)
            .attr("y1", d.y)
            .attr("x2", mouse[0])
            .attr("y2", mouse[1]);
        
        drag_line.mousedown_node = d3.select(this.parentNode);
        force.resume();
    }
    
    function mousemove(d) {
        if (drag_line) {
            var mouse = d3.mouse(this);
            drag_line
                .attr("x1", drag_line.mousedown_node.datum().x)
                .attr("y1", drag_line.mousedown_node.datum().y)
                .attr("x2", mouse[0])
                .attr("y2", mouse[1]);
            force.resume();
        }
    }

    function mouseup(d) {
        var event = d3.event;
        var eventTarget = d3.select(event.target);
        if (drag_line) {                     
            // if the cursor is inside the node
            if (event.target.nodeName == "circle") {                
                // select g container, which has .node class
                
                // this block handles connecting bonds to existing nodes

                // if the cursor is in a circle, but not the same circle
                if (drag_line.mousedown_node.datum() !== eventTarget.datum()) {
                    // add new link
                    var dragLink = {source: drag_line.mousedown_node.datum(), target: eventTarget.datum()};
                    links.push(dragLink);   

                    // execute enter()
                    draw(); 
                } else { // use else so that target node is not selected
                
                    // remove selection from link
                    if (selectedLink) {
                        selectedLink.classed("selected", false);
                    }

                    // this block handles selections
                    if (!selectedNode) { // first selection
                        // select new node
                        eventTarget.classed("selected", true);
                        selectedNode = eventTarget;         
                    } else {
                        // weird logic to handle selecting both same node and new node
                        // because we can't test if (selectedNode === eventTarget)

                        // toggle selection
                        var classed = eventTarget.classed("selected");
                        // remove selection from old node
                        selectedNode.classed("selected", false);
                        // select new node
                        eventTarget.classed("selected", !classed);
                        selectedNode = eventTarget;                    
                    }   
                }         


                // remove drag_line
                drag_line.remove();
                drag_line = null;
            }  
            // if the cursor is outside the node
            else {
                // add new node and link
                var mouse = d3.mouse(this);
                var dragNode = {x: mouse[0], y: mouse[1], id: currAtom};
                nodes.push(dragNode);
                var dragLink = {source: drag_line.mousedown_node.datum(), target: dragNode};
                links.push(dragLink);

                // remove drag_line
                drag_line.remove();
                drag_line = null;

                // execute enter()
                force.start();
                draw();
            }   
        } else if (event.target.nodeName == "line") { // drag_line won't exist when selecting bonds
            // this block handles selections

            // remove selection from node                
            if (selectedNode) {
                selectedNode.classed("selected", false);
            }
                
            if (!selectedLink) { // first selection
                // select new node
                eventTarget.classed("selected", true);
                selectedLink = eventTarget;         
            } else {
                // weird logic to handle selecting both same node and new node
                // because we can't test if (selectedLink === eventTarget)

                // toggle selection
                var classed = eventTarget.classed("selected");
                // remove selection from old link
                selectedLink.classed("selected", false);
                // select new node
                eventTarget.classed("selected", !classed);
                selectedLink = eventTarget;                    
            }
            force.resume();
        }
    }


    function keydown() {       
        switch (d3.event.keyCode) {
            case 8: // backspace
            case 46: { // delete
                if (selectedNode && 
                        selectedNode.classed("selected")) { // is a node

                    //remove links to selectedNode
                    for (var i = links.length - 1; i >= 0; i--) {
                        if (links[i].source === selectedNode.datum() ||
                            links[i].target === selectedNode.datum())
                            links.splice(i, 1);
                    }
                    
                    //remove selectedNode                        
                    var index = nodes.indexOf(selectedNode.datum());
                    nodes.splice(nodes.indexOf(selectedNode.datum()), 1);
                    //selectedNode.remove(); // exit doesn't handle this correctly

                    //remove selection
                    selectedNode.classed("selected", false);

                }
                else if (selectedLink && selectedLink.classed("selected")) { // is a link
                    links.splice(links.indexOf(selectedLink.datum()), 1);
                    selectedLink.classed("selected", false);
                }
                draw();
                break;
            }
        }
    }


})();
