'use strict';
//charge = valence - electrons - weight
//weight = numBonds


(function () {
    var width = 800,
        height = 600;

    var currAtom = 'C',
        bondType = "single";   

    var nodes = [{id: 'C'}, {id: 'H'}],
        links = [{source: 0, target: 1, type: bondType, index: linkIndex++}];

    var force = d3.layout.force()
        .size([width, height])
        .nodes(nodes)
        .links(links)
        .linkDistance(function(d) {return d.isElectron ? 1: 20;})
        .charge(function(d) {return d.isElectron ? -100: -400;})
        //.friction(0.1)
        .on('tick', tick)
        .start();

    var svg = d3.select('#editor')
        .append('svg:svg')
        .attr('width', width)
        .attr('height', height)
        .attr('pointer-events', 'all')
        .on("mousemove", mousemove)
        .on("mouseup", mouseup);
    
    d3.select(window).on("keydown", keydown);

    var show_h = document.getElementById('show_h');    
    show_h.onchange = function() {
        if (this.checked)
            initHydrogens();
        else {
            collapseHydrogens();
            if (!show_c.checked)
                hideCarbons();
        } 
    };

    var show_c = document.getElementById('show_c');    
    show_c.onchange = function() {
        this.checked ? showCarbons() : hideCarbons(); 
    };

    var nodesSelection = svg.selectAll(".node"),
        linksSelection = svg.selectAll(".link");

    var drag_line = null;

    var selectedNode = null,
        selectedLink = null;

    //TODO: redo logic for adding new atoms in mouseup

    draw();

    importSmiles();

    var group = {
		H:1, Li:1, Na:1, K:1, Rb:1, Cs:1, Fr:1,
		Be:2, Mg:2, Ca:2, Sr:2, Ba:2, Ra:2,
		/*La:3, Ac:3, 
		Ce:4, Th:4,
		Pr:4, Pa:5,
		Nd:4, U:6,
		Pm:3, Np:7,
		Sm:3, Pu:8,
		Eu:3, Am:7,
		Gd:3, Cm:8,
		Tb:4, Bk:4,
		Dy:4, Cf:4,
		Ho:3, Es:4,
		Er:3, Fm:3,
		Tm:4, Md:3,
		Yb:3, No:3,
		Sc:3, Y:3, Lu:3, Lr:3,
		Ti:4, Zr:4, Hf:4, Rf:4,
		V:5, Nb:5, Ta:5, Db:5,
		Cr:6, Mo:6, W:6, Sg:6,
		Mn:7, Tc:7, Re:7, Bh:7,
		Fe:6, Ru:8, Os:8, Hs:8,
		Co:5, Rh:6, Ir:8,
		Ni:4, Pd:6, Pt:6,
		Cu:4, Ag:4, Au:5,*/
		Zn:2, Cd:2, Hg:4,
		B:3, Al:3, Ga:3, In:3, Tl:3, 
		C:4, Si:4, Ge:4, Sn:4, Pb:4,
		N:5, P:5, As:5, Sb:5, Bi:5,
		O:6, S:6, Se:6, Te:6, Po:6,
		F:7, Cl:7, Br:7, I:7, At:7,
		He:8, Ne:8, Ar:8, Kr:8, Xe:8, Rn: 8
	};

	var tds = document.getElementsByTagName('td');
    for (var i = 0; i < tds.length; i++) {
      if (tds[i].childElementCount) //will be equal to 1 if has sup tag
        tds[i].onclick = periodicTableClick;
    }

    function periodicTableClick(event) {
      currAtom = this.lastChild.nodeValue.trimRight();
      document.getElementById('periodic-button').firstChild.nodeValue = currAtom;
      document.getElementById('periodic-table').style.visibility = '';
    }

    document.getElementById('periodic-button').onclick = function(event) {  
      document.getElementById('periodic-table').style.visibility = 'visible';
    };

    document.getElementById('periodic-close').onclick = function(event) {  
      document.getElementById('periodic-table').style.visibility = '';
    };   

    document.getElementById('b1').onchange = function(event) {  
	    bondType = "single";
	  };

    document.getElementById('b2').onchange = function(event) {  
      bondType = "double";
    };

    document.getElementById('b3').onchange = function(event) {  
      bondType = "triple";
    };

    function importSmiles() {
        nodesSelection.remove();
        linksSelection.remove();
        nodesSelection = svg.selectAll(".node"),
        linksSelection = svg.selectAll(".link");
        //var struct = smilesToStructure("O1CC(=CCC)C(C(B)O)CCC1[CH2]=O");
        //var struct = smilesToStructure("C(C)(C)(C)(C)C[CH2]");
        //var struct = smilesToStructure("C(C)(C)(C)(C)[CH2]");
        var struct = smilesToStructure("OCOC(=[O+])CO");
        nodes = struct[0]; links = struct[1];

        force.nodes(nodes);
        force.links(links);
        force.start();
        initCalcHydrogensAndCharge();
        console.log(nodes);
        console.log(links);
        initElectrons();
        initHydrogens();
        draw();  
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

        nodesEnter.each(function (d) {
            var thisSelection = d3.select(this);
            if (d.isElectron) {
                thisSelection.append("circle") 
                               .attr("r", 2)
                               .style("fill", "red");
            } else {
                thisSelection.append("circle")
                          .attr("r", 8)
                          .on("mousedown", mousedown);
                thisSelection.append("text")
                          .text(function(d) {return d.id || 'X' ;})
                          .attr("pointer-events", "none")
                          .attr("dx", "-0em")
                          .attr("text-anchor", "middle")
                          .attr("dy", ".35em"); 
                var charge = thisSelection.append("text")
                             .text(function(d) {
                                       return stringFromCharge(d.charge);
                             })
                             .style("font-size", "10px")
                             .attr("pointer-events", "none")
                             .attr("dx", "1.5em");
                             //.attr("text-anchor", "top")
                             //.attr("dy", ".35em");  
                d.chargeNode = charge.node();
            }
        });  
        
        var nodesExit = nodesSelection.exit();
        nodesExit.remove();

        force.start();
    }

    function stringFromCharge(charge) {
        var str = "";
        if (charge) {
        
           if (charge < 0)
               str += "-";
           else 
               str += "+";
           
           if (Math.abs(charge) > 1)
               str += ""+charge;
          
       }  
       return str;  
    }

    function initElectrons() {        
        var nodesLength = nodes.length;
        for (var i = 0; i < nodesLength; i++) {
            var charge = nodes[i].charge;
            //if (charge > 0) {
                
            
                var weight = calcWeight(nodes[i]);
                weight = weight + nodes[i].hydrogens;
                var valence = valenceLookup(nodes[i].id, weight);
                var numElectrons = 8 - valence - weight - charge;   

                //var g = group[nodes[i].id];     

                while (numElectrons-- > 0) {
                    var electron = {isElectron: true};
                    nodes.push(electron);
                    links.push({source: electron, target: nodes[i], isElectron: true, index: linkIndex++});
                }
            //}
        }
        force.start(); //initialize node.index for key function
        draw();
    }

    function initHydrogens() {
        for (var i = nodes.length - 1; i >= 0; i--) {
            if (nodes[i].isHydrogen)
                nodes.splice(i, 1);
        } 
        for (var i = links.length - 1; i >= 0; i--) {
            if (links[i].isHydrogen)
                links.splice(i, 1);
        } 
        draw();
        var nodesLength = nodes.length;
        for (var i = 0; i < nodesLength; i++) {
            var numHydrogens = nodes[i].hydrogens;
            while (numHydrogens-- > 0) {
                var hydrogen = {id: 'H', isHydrogen: true, x: nodes[i].x, y:nodes[i].y};
                nodes.push(hydrogen);
                links.push({source: hydrogen, target: nodes[i], type: 'single', isHydrogen: true, index: linkIndex++});
            }
        }
        force.start(); //initialize node.index for key function
        draw();     
    }

    function collapseHydrogens() {
        var toSplice = [];
        for (var i = nodes.length - 1; i >= 0; i--) {
            //only for carbon atoms
            if (nodes[i].id == "C") {
                // go through all links
                for (var j = links.length - 1; j >= 0; j--) {
                    //hydrogen links
                    if (links[j].isHydrogen) {
                        var source = links[j].source;
                        var target = links[j].target;
                        //if source is connected to carbon atom
                        if (source === nodes[i]) {
                            //remove target
                            toSplice.push(nodes.indexOf(target));
                            links.splice(j, 1);
                        }
                        if (target === nodes[i]) {
                            //remove the link                      
                            toSplice.push(nodes.indexOf(source));
                            links.splice(j, 1);
                        }
                    }
                }                    
            }
        }

        function compareNumbers(a, b)
        {
            return a - b;
        }
        toSplice.sort(compareNumbers);
        for (var i = toSplice.length - 1; i >= 0; i--) {
            nodes.splice(toSplice[i], 1);    
        }    
         
        draw();   
    }

    //only removes one proton
    //doesn't modify node.charge or node.hydrogens
    //doesn't work properly
    //
    function removeOneProton(node) {
        for (var j = links.length - 1; j >= 0; j--) {
            //hydrogen links
            if (links[j].isHydrogen) {
                var source = links[j].source;
                var target = links[j].target;
                //if source is connected to carbon atom
                if (source === node) {
                    //remove target
                    nodes.splice(nodes.indexOf(target), 1);
                    links.splice(j, 1);
                    break;
                }
                if (target === node) {
                    //remove the link                      
                    nodes.splice(nodes.indexOf(source), 1);
                    links.splice(j, 1);
                    break;
                }
            }
        }
    }

    function redrawHydrogens(node) {
        var toSplice = [];
        for (var j = links.length - 1; j >= 0; j--) {
            //hydrogen links
            if (links[j].isHydrogen) {
                var source = links[j].source;
                var target = links[j].target;
                //if source is connected to carbon atom
                if (source === node) {
                    //remove target
                    toSplice.push(nodes.indexOf(target));
                    links.splice(j, 1);
                }
                if (target === node) {
                    //remove the link                      
                    toSplice.push(nodes.indexOf(source));
                    links.splice(j, 1);
                }
            }
        }                       

        function compareNumbers(a, b)
        {
            return a - b;
        }
        toSplice.sort(compareNumbers);
        for (var i = toSplice.length - 1; i >= 0; i--) {
            nodes.splice(toSplice[i], 1);    
        } 

        draw();
        var nodesLength = nodes.length;
        for (var i = 0; i < nodesLength; i++) {
            var numHydrogens = node.hydrogens;
            while (numHydrogens-- > 0) {
                var hydrogen = {id: 'H', isHydrogen: true, x: nodes[i].x, y:nodes[i].y};
                nodes.push(hydrogen);
                links.push({source: hydrogen, target: node, type: 'single', isHydrogen: true, index: linkIndex++});
            }
        }
        force.start(); //initialize node.index for key function
        draw();
    }

    function updateCharge(node) {
        /*var weight = calcWeight(node)
        if (!show_h.checked)
            weight += node.hydrogens; //PROBLEM: calcWeight doesn't count hidden H
        var valence = valenceLookup(node.id, weight);
        node.charge = weight - valence;  
        console.log(node.charge);*/
        node.chargeNode.textContent =  stringFromCharge(node.charge); 
    }

    function hideCarbons() { 
        function hideSome() {
            //hide all carbon atoms except those connected to a hydrogen
            for (var i = 0; i < nodes.length; i++) {
                if (nodes[i].id === "C") {
                    var hasH = false;
                    for (var j = 0; j < links.length; j++) {            
                        if (links[j].isHydrogen &&
                           (links[j].source === nodes[i] || links[j].target === nodes[i])) {
                            hasH = true;
                            break;            
                        }
                    }
                    if (!hasH) {
                        var nodeToHide = nodesSelection.filter(function(d) {return nodes[i] === d;});
                        nodeToHide.classed("hidden-carbon", true);
                    }
                }
            }    
        }       

        if (!show_h.checked) {               
            hideSome();    
        } else {
            collapseHydrogens();
            hideSome();
            initHydrogens();
        }
    }

    function showCarbons() {
        nodesSelection.classed("hidden-carbon", false);          
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
            if (event.target.nodeName == "circle" && !eventTarget.datum().isElectron) {          

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
                var dragNode = {x: mouse[0], y: mouse[1], id: currAtom, charge: 0, hydrogens: 0};
                nodes.push(dragNode);
                var dragLink = {source: drag_line.mousedown_node.datum(), target: dragNode,
                                type: bondType, index: linkIndex++};
                links.push(dragLink);

                if (isOrganic(dragNode.id)) {
                	var weight = calcWeight(dragNode);
                    var valence = valenceLookup(dragNode.id, weight);
                    var implicitHydrogens = calcImplicitHydrogens(valence, weight);
                    dragNode.hydrogens = implicitHydrogens;

                    weight = weight + implicitHydrogens;
                    valence = valenceLookup(dragNode.id, weight); // not sure if needed
                    //console.log("weight: " +weight+"\nvalence: "+valence);
                    dragNode.charge = weight - valence;
                }
//                 console.log(dragNode.charge);
//                 console.log(dragNode.hydrogens);

				
                if (isOrganic(dragNode.id)) {                
                //TODO: create a function for this, the same code is in initCalcHydrogensAndCharge
                /*var weight = calcWeight(dragNode);
                var valence = valenceLookup(dragNode.id, weight);
                var implicitHydrogens = calcImplicitHydrogens(valence, weight);
                dragNode.hydrogens = implicitHydrogens;

                weight = weight + implicitHydrogens;
                valence = valenceLookup(dragNode.id, weight); // not sure if needed                
                dragNode.charge = weight - valence;         
                */

                //from initHydrogens
					if (show_h.checked) {
						var numHydrogens = dragNode.hydrogens;
						while (numHydrogens > 0) {
							numHydrogens--;
							var hydrogen = {id: 'H', isHydrogen: true};
							nodes.push(hydrogen);
							links.push({source: hydrogen, target: dragNode, type: 'single', isHydrogen: true, index: linkIndex++});
						}
					}
                }
                /////////
                var wasdragline = drag_line;
                // remove drag_line
                drag_line.remove();
                drag_line = null;

                // execute enter()
                force.start();
                draw();

                var mdn = wasdragline.mousedown_node;
                var mdndatum = mdn.datum(); 
                //if (isOrganic(mdndatum.id)) {
                    if (mdndatum.hydrogens > 0) {
                        mdndatum.hydrogens--;
                        //removeOneProton(mdndatum);
                        //redrawHydrogens(mdndatum);
                    }
                    else {
                        mdndatum.charge += 1;
                        updateCharge(mdndatum);
                    }
                //}       

                
	

				var weight = calcWeight(dragNode);
				weight = weight + dragNode.hydrogens;
				var valence = valenceLookup(dragNode.id, weight);
				var numElectrons = 8 - valence - weight - dragNode.charge;   

				//var g = group[nodes[i].id];     

				while (numElectrons > 0) {
					numElectrons--;
					var electron = {isElectron: true};
					nodes.push(electron);
					links.push({source: electron, target: dragNode, isElectron: true, index: linkIndex++});
				}


				force.start(); //initialize node.index for key function
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

                for (var i = 0; i < nodes.length; i++) {
                    if (nodes[i].id)
                        updateCharge(nodes[i]);
                }
                draw();
                break;
            }
        }
    }        

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
            if ((link.source === node ||
                link.target === node) &&
                !link.isElectron)
                weight += bondToOrder(link.type);
        });
        return weight;
    }

    function initCalcHydrogensAndCharge() {
        for (var i = 0; i < nodes.length; i++) {
            if (isOrganic(nodes[i].id)) {
                if (nodes[i].hydrogens !== null && nodes[i].charge !== null) {

                } else if (nodes[i].hydrogens !== null) {
                    /*var weight = calcWeight(nodes[i]) + nodes[i].hydrogens;
                    var valence = valenceLookup(nodes[i].id, weight);
                    nodes[i].charge = weight - valence;*/
                } else if (nodes[i].charge !== null) {
                    /*var weight = calcWeight(nodes[i]);   
                    var valence = valenceLookup(nodes[i].id, weight);
                    nodes[i].hydrogens = valence - weight + nodes[i].charge;*/
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
