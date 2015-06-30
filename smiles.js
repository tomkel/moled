function getTokens(input) {
    var smiles = input;

    if (smiles === '') {
      return [ ];
    }

    return Parser.parse(smiles);
}

function orderToString(order) {
    switch (order) {
        case 1:
            return "single";
        case 2:
            return "double";
        case 3:
            return "triple";
        case 4:
            return "quadruple";
    }
}

var linkIndex = 0;

// this method inserts H0 and -0 into bracketed atoms that don't have hydrogens or charge specified
function completeBracketedAtoms(input) {
    var i = 0;
    while (i++ < input.length) {
        if (input[i] === "[") {
            i++;
            if (/[A-Z]/.test(input[i])) {
                i++; 
                if (/[a-z]/.test(input[i])) i++;                
                if (input[i] === "@") {
                    //step past chiral class    
                    i++;
                    if (input[i] === "@") {
                        i++;
                    } else if (/[TASO]/.test(input[i])) {
                        i += 3;
                        if (/\d/.test(input[i]))
                            i++;
                    }
                }

                if (input[i] !== "H") {                    
                    input = [input.slice(0, i), "H0", input.slice(i)].join('');                    
                }
                i = i + 2;

                if (!/[-+]/.test(input[i])) {
                    input = [input.slice(0, i), "-0", input.slice(i)].join('');                       
                }
                i = i + 2;
            }
        }
    }

    return input;
}

function smilesToStructure(input) {

    input = completeBracketedAtoms(input);

    var tokens = getTokens(input);
    var nodes = [],
        links = [];
    var lastAtom = {};

    // first pass: create nodes for atoms
    for (var i = 0; i < tokens.length; i++) {
        if (tokens[i].type == "atom") {
            var node = {id: tokens[i].symbol,
                        hydrogens: tokens[i].hydrogens,
                        charge: tokens[i].charge};            
            nodes.push(node);
            tokens[i].node = node;
        }   
    }

    // second pass: close rings
    var closures = [];
    var deleteTokens = [];
    for (var i = 0; i < tokens.length; i++) {        
        if (tokens[i].type == "ring-closure") {            
            var index = tokens[i].index;            
            if (closures[index] !== undefined) {
                closures[index].target = lastAtom;
                links.push(closures[index]);
                closures[index] = undefined;                
            }                
            else {     
                closures[index] = {source: lastAtom,                                
                                   type: "single",
                                   index: linkIndex++};                
            }
            deleteTokens.push(i);            
        } else if (tokens[i].type == "atom")
            lastAtom = tokens[i].node;
    }
    //remove closures from tokens array
    for (var i = deleteTokens.length - 1; i >= 0; i--)
        tokens.splice(deleteTokens[i], 1);


    // third pass: splice branches 
    branches = []; //keeps track of branches
    branches2 = [];//stores them once completed
    var branch = -1; //tracks branch depth 
    var lastAtom = []; //tracks last atom at various depths
    for (var i = 0; i < tokens.length; i++) {
        if (tokens[i].type == "open-branch") {
            branches[++branch] = {first: tokens[i]};            
            tokens[i+1].lastAtom = lastAtom[branch];            
        } else if (tokens[i].type == "close-branch") {
            var depth = branch;
            branches[branch--].second = tokens[i];  
            if (!branches2[depth])
                branches2[depth] = []; // initialize array at depth          
            branches2[depth].push(branches[depth]); // stores in an array with index depth
        } else if (tokens[i].type == "atom")
            lastAtom[branch+1] = tokens[i].node;
    }
    branchTokens = [];
    for (var i = branches2.length - 1; i >= 0; i--) {
        for (var j = 0; j < branches2[i].length; j++) {
            var startIndex = tokens.indexOf(branches2[i][j].first),
                endIndex = tokens.indexOf(branches2[i][j].second),
                count = endIndex - startIndex + 1; // add 1 to include close branch
            var branch =  tokens.splice(startIndex, count);
            branch.pop();
            branch.shift();
            branchTokens.push(branch);
        }
    }
    

    function createBonds(tokenArr) {
        var lastAtom = {};
        var i = 0;

        if (tokenArr[0].lastAtom) {
            switch(tokenArr[0].type) {
                case "atom":
                    links.push({source: tokenArr[0].lastAtom,
                                target: tokenArr[0].node,
                                type: "single",
                                index: linkIndex++});
                    lastAtom = tokenArr[0].node;
                    i = 1;
                    break;
                case "bond":
                    links.push({source: tokenArr[0].lastAtom,
                                target: tokenArr[1].node,
                                type: orderToString(tokenArr[0].order),
                                index: linkIndex++}); 
                    lastAtom = tokenArr[1].node;
                    i = 2;
                    break;     
            }
        }

        for (; i < tokenArr.length; i++) {

            switch(tokenArr[i].type) {
                case "atom":
                    if (i > 0 && tokenArr[i-1].type == "atom")
                        links.push({source: lastAtom,
                                    target: tokenArr[i].node,
                                    type: "single",
                                    index: linkIndex++});

                    lastAtom = tokenArr[i].node;
                    break;
                case "bond":                    
                    var link = {source: lastAtom,
                                target: tokenArr[i+1].node,
                                type: orderToString(tokenArr[i].order),
                                index: linkIndex++};
                    links.push(link);
                    break;
            }
        }
    }

    for (var i = 0; i < branchTokens.length; i++) {
        createBonds(branchTokens[i]); 
    }
    createBonds(tokens);    

    return [nodes, links];
    
}