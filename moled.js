(function () {
    var width = 500,
        height = 500;

    var currAtom = 'C',
        bondType = "single";   

    var nodes = [{id: 'C'}, {id: 'H'}],
        links = [{source: 0, target: 1, type: bondType, index: linkIndex++}];

    var force = d3.layout.force()
        .size([width, height])
        .nodes(nodes)
        .links(links)
        .linkDistance(30)
        .charge(-500)
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
        linksSelection.selectAll("line")
            .attr("x1", function(d) { return d.source.x; })
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

        linksSelection = linksSelection.data(links, function(d) {return d.index;});
        var linksEnter = linksSelection.enter()
            .insert("g", ".node") // insert so that nodes stay on top                        
            .attr("class", "link");
        
        linksEnter.each(function (d) {
            var thisSelection = d3.select(this);
            if (d.type === "single") {
                thisSelection.append("line");
            } else if (d.type === "double") {
                thisSelection.append("line").style("stroke-width", 5);
                thisSelection.append("line").style("stroke-width", 3).style("stroke", "white");      
            } else if (d.type === "triple") {                
                thisSelection.append("line").style("stroke-width", 10);
                thisSelection.append("line").style("stroke-width", 8).style("stroke", "white");                      
                thisSelection.append("line").style("stroke-width", 1);      
            } else if (d.type === "quadruple") {
                thisSelection.append("line").style("stroke-width", 15);
                thisSelection.append("line").style("stroke-width", 13).style("stroke", "white");
                thisSelection.append("line").style("stroke-width", 6);
                thisSelection.append("line").style("stroke-width", 4).style("stroke", "white");
            }             
        });
        

        var linksExit = linksSelection.exit();
        linksExit.remove();

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

                // this block handles connecting bonds to existing nodes

                // if the cursor is in a circle, but not the same circle
                if (drag_line.mousedown_node.datum() !== eventTarget.datum()) {
                    // add new link
                    var dragLink = {source: drag_line.mousedown_node.datum(), target: eventTarget.datum(),
                                    type: bondType, index: linkIndex++};
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
                var dragLink = {source: drag_line.mousedown_node.datum(), target: dragNode,
                                type: bondType, index: linkIndex++};
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
            eventTarget = d3.select(event.target.parentNode);
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
                    nodes.splice(nodes.indexOf(selectedNode.datum()), 1);

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
    
    function importSmiles() {
        nodesSelection.remove();
        linksSelection.remove();
        nodesSelection = svg.selectAll(".node"),
        linksSelection = svg.selectAll(".link");
        //var struct = smilesToStructure("OCC(=CCC)C(C(B)O)CCC");
        var struct = smilesToStructure("C(C)(C)(C)(C)C[CH2]");
        nodes = struct[0]; links = struct[1];

        force.nodes(nodes);
        force.links(links);
        force.start();
        initHydrogensAndCharge();
        draw();  
    }     
    importSmiles();
    console.log(nodes);

    function isOrganic(atom) {
        return atom == "B" ||
               atom == "C" ||
               atom == "N" ||
               atom == "O" ||
               atom == "P" ||
               atom == "S" ||
               atom == "F" ||
               atom == "Cl"||
               atom == "Br"||
               atom == "I";
        return Boolean(valenceLookup(atom, 0));
    }

    function valenceLookup(atom, weight) {
        switch (atom) {
            case "B":
                return 3;
            case "C":
                return 4;
            case "N":
                if (weight > 3)
                    return 5;
                else
                    return 3;
            case "O":
                return 2;
            case "P":
                if (weight > 2) {
                    if (weight > 4)
                        return 6;
                    else
                        return 4;
                } else
                    return 2;
            case "S":
                if (weight > 3)
                    return 5;
                else
                    return 3;
            case "F":
                return 1;
            case "Cl":
                return 1;
            case "Br":
                return 1;
            case "I":
                return 1;
        }

    }

    function calcImplicitHydrogens(valence, weight) {
        if (weight >= valence)
            return 0;
        return valence - weight;
    }

    function bondToOrder(bond) {
        switch (bond) {
            case "single":
                return 1;
            case "double":
                return 2;
            case "triple":
                return 3;
            case "quadruple":
                return 4;
        }
    }

    function calcWeight(node) {
        var weight = 0;
        links.forEach(function (link, index) {
            if (link.source === node ||
                link.target === node)
                weight += bondToOrder(link.type);
        });
        return weight;
    }

    function initHydrogensAndCharge() {
        for (var i = 0; i < nodes.length; i++) {
            if (isOrganic(nodes[i].id)) {
                if (nodes[i].hydrogens !== null && nodes[i].charge !== null) {

                } else if (nodes[i].hydrogens !== null) {
                    var weight = calcWeight(nodes[i]) + nodes[i].hydrogens;
                    var valence = valenceLookup(nodes[i].id, weight);
                    nodes[i].charge = weight - valence;
                } else if (nodes[i].charge !== null) {
                    var weight = calcWeight(nodes[i]);   
                    var valence = valenceLookup(nodes[i].id, weight);
                    nodes[i].hydrogens = valence - weight + nodes[i].charge;
                } else {
                    var weight = calcWeight(nodes[i]);
                    var valence = valenceLookup(nodes[i].id, weight);
                    var implicitHydrogens = calcImplicitHydrogens(valence, weight);
                    nodes[i].hydrogens = implicitHydrogens;

                    weight = weight + implicitHydrogens;
                    valence = valenceLookup(nodes[i].id, weight); // not sure if needed
                    //console.log("weight: " +weight+"\nvalence: "+valence);
                    nodes[i].charge = weight - valence;
                }
            }
        }
    }
})();
