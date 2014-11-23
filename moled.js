"use strict"
var SVG_NS = 'http://www.w3.org/2000/svg';
var svg = document.getElementById('svg');
var rootG = document.getElementById('rootG');
var eventG = document.getElementById('eventG');
//svg.onmousemove = SVGMouseMove;
svg.onmousedown = SVGMouseDown;
/*svg.ondragstart = function(event) {
  //return false;
  event.preventDefault();
};*/
document.addEventListener('dragstart', function(event) { event.preventDefault(); }, true);
//avoid polling svg every millisecond
if (svg.offsetLeft) {
  var SVG_OFFSET_LEFT = svg.offsetLeft;
  var SVG_OFFSET_TOP = svg.offsetTop;
} else {
  var rectObj = svg.getBoundingClientRect();
  var SVG_OFFSET_LEFT = rectObj.left;
  var SVG_OFFSET_TOP = rectObj.top;
  //delete rectObj;
}
//disable scrolling, helps with mouse handling
window.scrollbars.visible = false;

var currAtom = 'C';

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
}

document.getElementById('periodic-close').onclick = function(event) {  
  document.getElementById('periodic-table').style.visibility = '';
}

var add_h = 0;
document.getElementById('erase').onchange = function(event) {  
  add_h = -1;
}

document.getElementById('h1').onchange = function(event) {  
  add_h = 0;
}

document.getElementById('h2').onchange = function(event) {  
  add_h = 1;
}

document.getElementById('e1').onchange = function(event) {  
  add_h = 2;
}

document.getElementById('e2').onchange = function(event) {  
  add_h = 3;
}

var drawTarget = singleBond;
document.getElementById('b1').onchange = function(event) {  
  drawTarget = singleBond;
}

document.getElementById('b2').onchange = function(event) {  
  drawTarget = doubleBond;
}

document.getElementById('b3').onchange = function(event) {  
  drawTarget = tripleBond;
}

var Global = {
  VALENCES: {
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
  },
  INITIAL_H:  {
    C:4,
    N:3, P:3,
    O:2, S:2,
    F:1, Cl:1, Br:1, I:1
  }
};

document.getElementById('clear').onclick = function(event) {
  while (rootG.childElementCount > 0) {
    rootG.removeChild(rootG.firstElementChild);
  }
  while (eventG.childElementCount > 0) {
    eventG.removeChild(eventG.firstElementChild);
  }
  ghosts = null;
  
  drag.isDragging = false;
  drag.mouseDown = false;
  drag.selecting = null;  
}

document.getElementById('gen').onclick = genSMILES;

function SVGMouseMove(event) {
  getMousePos(event);
}

function SVGMouseDown(event) {
  if (event.eventPhase === 2) {
    if (event.button === 0) {
      getMousePos(event);
      var molecule = Molecule();
      calcExplicitH(molecule.firstElementChild.textNode);
      molecule.firstElementChild.setAttribute('transform', 'translate('+x+','+y+')');
      //molecule.firstElementChild.onmouseover();
      rootG.appendChild(molecule);
      addEventBox(molecule.firstElementChild);
      //setTimeout(function(){carbon = Atom();}, 500);
      //TODO: use  = new Molecule();
    }
  }
}

svg.oncontextmenu = function(event) {
  event.preventDefault();
}

function rectMouseEnter(event) {
  if (isAtom(this.elem)) {
    //check if already has ghosts
    if (!this.elem.children[0] !== ghosts) {
      if (ghosts) {
        ghosts.parentElement.removeChild(ghosts);
        scrubEventBoxes();
      }
      //check if lone atom
      ghosts = Ghosts(this.elem);
      //insert at beginning
      this.elem.insertBefore(ghosts, this.elem.firstElementChild);
      for (var i = 0; i < ghosts.children.length; i++) {
        addEventBox(ghosts.children[i]);
      }
    }
  } else if (isBond(this.elem)) {
    if (this.elem.parentElement === ghosts) {
      
    } else if (ghosts) {
      ghosts.parentElement.removeChild(ghosts);
      ghosts = null;
      scrubEventBoxes();
    }
  }
  
}

function rectMouseLeave(event) {
  drag.isDragging = false;
  drag.mouseDown = false;
  drag.selecting = null;
}

var drag = {
  isDragging: false,
  mouseDown: false,
  origin: {
    x: 0.0,
    y: 0.0
  },
  selecting: null
};

function rectMouseUp(event) {
  //if (event.eventPhase != 2) return;
  drag.isDragging = false;
  drag.mouseDown = false;
  if (event.button === 2) {
    if (isAtom(this.elem)) {
      if (add_h === 0) {
        this.elem.textNode.num_h += 1;
      } else if (add_h === 1) {
        if (this.elem.textNode.num_h > 0)
          this.elem.textNode.num_h -= 1;
      } else if (add_h === 2) {
        this.elem.textNode.electrons += 1;
      } else if (add_h === 3) {        
        if (this.elem.textNode.electrons > 0)
          this.elem.textNode.electrons -= 1;
      }
      recurse(rootG);
    }
    
    if (add_h === -1) {
      if (this.elem.parentElement !== ghosts) {    
        if (isAtom(this.elem) && this.elem.bonds.length === 0)
          removeAtom(this.elem);
        else if (isBond(this.elem)) {
          if (this.elem.isRingBond) {
            removeRingBond(this.elem);
          } else if (this.elem.atom.bonds.length === 0) {
            removeBond(this.elem);          
          }
        } else 
          return;

        this.parentElement.removeChild(this);
        scrubEventBoxes();

        recurse(rootG);
        event.stopPropagation();
        ghosts = null;
      }

    }
  }
  if (event.button === 0) {
    if (drag.selecting) {
      drag.selecting.id = '';     
      this.elem.isRingBond = true;      
      
      ghosts.parentElement.appendChild(this.elem);
      
      // find molecule
      var molecule = getMolecule(this.elem);
      // add ringBond to database
      molecule.rings[molecule.rings.length] = [this.elem, this.elem.parentElement, drag.selecting.elem];
      
      if (this.elem.className.baseVal === 'singleBond') {
        this.elem.parentElement.textNode.num_h--;
        this.elem.parentElement.ringBonds++;
        drag.selecting.elem.textNode.num_h--;
        drag.selecting.elem.ringBonds++;
      } else if (this.elem.className.baseVal === 'doubleBond') {
        this.elem.parentElement.textNode.num_h -= 2;
        this.elem.parentElement.ringBonds += 2;
        drag.selecting.elem.textNode.num_h -= 2;
        drag.selecting.elem.ringBonds += 2;
      } else if (this.elem.className.baseVal === 'tripleBond') {
        this.elem.parentElement.textNode.num_h -= 3;
        this.elem.parentElement.ringBonds += 3;
        drag.selecting.elem.textNode.num_h -= 3;
        drag.selecting.elem.ringBonds += 3;
      }
      if (this.elem.parentElement.textNode.num_h < 0)
        this.elem.parentElement.textNode.num_h = 0;
      if (drag.selecting.elem.textNode.num_h < 0)
        drag.selecting.elem.textNode.num_h = 0
        
      var path = this.elem.firstElementChild;
      this.width.baseVal.value = path.width - 5;  
        
      ghosts.parentElement.removeChild(ghosts);
      ghosts = null;
      scrubEventBoxes();
      
      recurse(rootG);      
      
    } else if (this.elem.parentElement === ghosts) {
      
      //g molecule
      //--g atom transform='translate(...)'
      //----g id='ghosts'
      //------g transform='matrix([rotation])' === this.elem
      //--------path
      //var matrix = this.getCTM();
      ghosts.parentElement.appendChild(this.elem);
      //var transform = svg.createSVGTransformFromMatrix(matrix);
      //this.transform.baseVal.initialize(transform);
      
      var atom = Atom();   
      
      if (this.elem.className.baseVal === 'singleBond') {
        this.elem.parentElement.textNode.num_h--;
        atom.textNode.num_h--;
      } else if (this.elem.className.baseVal === 'doubleBond') {
        this.elem.parentElement.textNode.num_h -= 2;
        atom.textNode.num_h -= 2;
      } else if (this.elem.className.baseVal === 'tripleBond') {
        this.elem.parentElement.textNode.num_h -= 3;
        atom.textNode.num_h -= 3;
      }
      if (this.elem.parentElement.textNode.num_h < 0)
        this.elem.parentElement.textNode.num_h = 0;
      if (atom.textNode.num_h < 0)
        atom.textNode.num_h = 0;
            
      var path = this.elem.firstElementChild;
      this.width.baseVal.value = path.width - 8;         

      this.elem.atom = atom;
      atom.bondFrom = this.elem;
      ghosts.parentElement.bonds.push(this.elem);
      ghosts.parentElement.removeChild(ghosts);
      ghosts = null;
      scrubEventBoxes();
      this.elem.appendChild(atom);
      
      var transform = this.elem.firstElementChild.transform.baseVal.consolidate();
      var translate = svg.createSVGTransform();
      translate.setTranslate(path.width, 0);
      if (transform)
        atom.transform.baseVal.initialize(transform);
      atom.transform.baseVal.appendItem(translate);
      
      //fix rotation
      var matrix = svg.getTransformToElement(atom);
//       matrix.a = 1; matrix.b = 0; matrix.c = 0; matrix.d = 1;
      matrix.e = 0; matrix.f = 0;
      transform = svg.createSVGTransformFromMatrix(matrix)      
      atom.transform.baseVal.appendItem(transform);            
      
      addEventBox(atom);
      recurse(rootG);      
    } else if (isAtom(this.elem)) {
      if (this.elem.element !== currAtom) {
        this.elem.textNode.textContent = currAtom;

        if (Global.INITIAL_H[currAtom]) 
          this.elem.textNode.num_h = Global.INITIAL_H[currAtom];      
        else 
          this.elem.textNode.num_h = 0;

        if (Global.VALENCES[currAtom])
          this.elem.textNode.electrons = Global.VALENCES[currAtom] - this.elem.textNode.num_h;
        else
          this.elem.textNode.electrons = 0;

        this.elem.element = currAtom;
        this.elem.textNode.element = currAtom;   

        recurse(rootG);
      }  
    } else if (isBond(this.elem)) {
      
      var path = this.elem.firstElementChild;
      path.pathSegList.clear();
      if (drawTarget === singleBond) {
        path.pathSegList.appendItem(path.createSVGPathSegMovetoAbs(0, 0));
        path.pathSegList.appendItem(path.createSVGPathSegLinetoAbs(path.width, 0));
        this.elem.className.baseVal = 'singleBond';
      } else if (drawTarget === doubleBond) {      
        path.pathSegList.appendItem(path.createSVGPathSegMovetoAbs(0, -3));
        path.pathSegList.appendItem(path.createSVGPathSegLinetoAbs(path.width, -3));
        path.pathSegList.appendItem(path.createSVGPathSegMovetoAbs(0, 3));
        path.pathSegList.appendItem(path.createSVGPathSegLinetoAbs(path.width, 3));
        this.elem.className.baseVal = 'doubleBond';
      } else if (drawTarget === tripleBond) {            
        path.pathSegList.appendItem(path.createSVGPathSegMovetoAbs(0, -3));
        path.pathSegList.appendItem(path.createSVGPathSegLinetoAbs(path.width, -3));
        path.pathSegList.appendItem(path.createSVGPathSegMovetoAbs(0, 0));
        path.pathSegList.appendItem(path.createSVGPathSegLinetoAbs(path.width, 0));
        path.pathSegList.appendItem(path.createSVGPathSegMovetoAbs(0, 3));
        path.pathSegList.appendItem(path.createSVGPathSegLinetoAbs(path.width, 3));
        this.elem.className.baseVal = 'tripleBond';
      } 
      
      this.width.baseVal.value = path.width - 5;
    }
  }
  drag.selecting = null;
}

function rectMouseDown(event) {
  drag.mouseDown = true;
  drag.isDragging = false;
  getMousePos(event);
  drag.origin.x = x;
  drag.origin.y = y;
}

function rectMouseMove(event) {
  if (drag.mouseDown) {
    getMousePos(event)
    if (Math.abs(x - drag.origin.x) > 1 ||
        Math.abs(y - drag.origin.y) > 1) 
      drag.isDragging = true;
    
  }
  if (drag.isDragging)
    if (this.elem.parentElement === ghosts) {
  
      getMousePos(event);
      var hitRect = svg.createSVGRect();
      hitRect.x = x - 1;
      hitRect.y = y - 1;
      hitRect.width = 2;
      hitRect.height = 2;    
      
      var collisions = svg.getIntersectionList(hitRect, eventG);
      
      var isSelecting = false;
      for (var i = 0; i < collisions.length; i++) {
        var item = collisions.item(i);
        if (isAtom(item.elem) && item.elem !== ghosts.parentElement) {          
          drag.selecting = item;
          item.id = 'selecting';
          isSelecting = true; 
          break; // shouldnt be selecting more than one
        }
      }
      if (!isSelecting && drag.selecting) {
        drag.selecting.id = '';
        drag.selecting = null;        
      }
      
      console.log(collisions.length);

      
      // SCALE TRANSFORM SCALES COORDINATES TOO!!
  
      ///// EVENT BOX /////              
          
      var matrix = svg.getTransformToElement(this);
      var svgPoint = svg.createSVGPoint();
      svgPoint.x = x;
      svgPoint.y = y;
      svgPoint = svgPoint.matrixTransform(matrix); 
      
      // matrixTransform returns a point already relative to center
      // of rect. So don't need to adjust y value. Because this.y == -5?
      //svgPoint.y -= this.height.baseVal.value/2;
            
      var transform2_rotate = svg.createSVGTransform();
      var angle = Math.atan2(svgPoint.y, svgPoint.x) * 180/Math.PI;
      transform2_rotate.setRotate(angle, 0, 0);
      
      //SCALE EVENT BOX
      this.width.baseVal.value = svgPoint.x - 3 + 8;
      //ROTATE EVENT BOX
      if (this.transform.baseVal.numberOfItems === 1) {
        this.transform.baseVal.appendItem(transform2_rotate);
      } else {
        angle += this.transform.baseVal.getItem(1).angle;
        transform2_rotate.setRotate(angle, 0, 0);
        this.transform.baseVal.replaceItem(transform2_rotate, 1);
      }
      
      ///// PATH /////
       
      //transforms can only be in one list
      var transform_rotate = svg.createSVGTransform();
      // reset angle because it was added to prev angle
      angle = Math.atan2(svgPoint.y, svgPoint.x) * 180/Math.PI;
      
      if (this.elem.firstElementChild.transform.baseVal.numberOfItems > 0)
        angle += this.elem.firstElementChild.transform.baseVal.getItem(0).angle;
        
      transform_rotate.setRotate(angle, 0, 0);
      
      this.elem.firstElementChild.transform.baseVal.initialize(transform_rotate);
      
      // SCALE
      var path = this.elem.firstElementChild;
      path.pathSegList.clear();
      if (this.elem.className.baseVal === 'singleBond') {
        path.pathSegList.appendItem(path.createSVGPathSegMovetoAbs(0, 0));
        path.pathSegList.appendItem(path.createSVGPathSegLinetoAbs(svgPoint.x, 0));
      } else if (this.elem.className.baseVal === 'doubleBond') {      
        path.pathSegList.appendItem(path.createSVGPathSegMovetoAbs(0, -3));
        path.pathSegList.appendItem(path.createSVGPathSegLinetoAbs(svgPoint.x, -3));
        path.pathSegList.appendItem(path.createSVGPathSegMovetoAbs(0, 3));
        path.pathSegList.appendItem(path.createSVGPathSegLinetoAbs(svgPoint.x, 3));
      } else if (this.elem.className.baseVal === 'tripleBond') {            
        path.pathSegList.appendItem(path.createSVGPathSegMovetoAbs(0, -3));
        path.pathSegList.appendItem(path.createSVGPathSegLinetoAbs(svgPoint.x, -3));
        path.pathSegList.appendItem(path.createSVGPathSegMovetoAbs(0, 0));
        path.pathSegList.appendItem(path.createSVGPathSegLinetoAbs(svgPoint.x, 0));
        path.pathSegList.appendItem(path.createSVGPathSegMovetoAbs(0, 3));
        path.pathSegList.appendItem(path.createSVGPathSegLinetoAbs(svgPoint.x, 3));
      } 
      path.width = svgPoint.x;
      
    }
}

function Molecule() {
  var g = document.createElementNS(SVG_NS, 'g');
  g.appendChild(Atom());
  g.setAttribute('class', 'molecule');
  g.genSMILES = genSMILES;  
  g.rings = [];
  return g;
}

function Atom() {
  var g = document.createElementNS(SVG_NS, 'g');
  var text = document.createElementNS(SVG_NS, 'text');

  text.textContent = currAtom;
  text.setAttribute('dx', -5);
  text.setAttribute('dy', 5);
  
  g.appendChild(text);
   
  //text.onmouseenter = textMouseEnter;
  //text.onmouseleave = textMouseLeave;
  //text.onmousedown = textMouseDown;  
  if (Global.INITIAL_H[currAtom]) 
    text.num_h = Global.INITIAL_H[currAtom];      
  else 
    text.num_h = 0;
  
  if (Global.VALENCES[currAtom])
    text.electrons = Global.VALENCES[currAtom] - text.num_h;
  else
    text.electrons = 0;
  
  g.setAttribute('class', 'atom');
  g.element = currAtom;
  text.element = currAtom;
  g.bonds = [];
  g.ringBonds = 0;
  g.textNode = text;
    
  return g;
}

function Electrons(howMany) {
  var container = document.createElementNS(SVG_NS, 'g');
  container.className.baseVal = 'electrons';
  var coords = [{x: -8, y: -8},
    {x:0, y: -8},
    {x:8, y: -8},
    {x:-8, y:0},
    {x:8, y:0},
    {x:-8, y:8},
    {x:0, y:8},
    {x:8, y:8}];
  for (var i = 0; i < howMany; i++) {
    var circle = document.createElementNS(SVG_NS, 'circle');
    circle.cx.baseVal.value = coords[i].x;
    circle.cy.baseVal.value = coords[i].y;
    circle.r.baseVal.value = 3;
    
    container.appendChild(circle);
  }
  return container;
}

/*
 * returns g container with path
 */
function singleBond(matrix) {  
  var g = document.createElementNS(SVG_NS, 'g');
  g.setAttribute('class', 'singleBond');
  var path = document.createElementNS(SVG_NS, 'path');
  var transform = svg.createSVGTransformFromMatrix(matrix);
  g.transform.baseVal.appendItem(transform);
                                                          
  path.pathSegList.appendItem(path.createSVGPathSegMovetoAbs(0, 0));
  path.pathSegList.appendItem(path.createSVGPathSegLinetoAbs(48, 0));
  
  g.appendChild(path);
  g.isRingBond = false;
  path.width = 48;
  return g;
}

function doubleBond(matrix) {
  var g = document.createElementNS(SVG_NS, 'g');
  g.setAttribute('class', 'doubleBond');
  var path = document.createElementNS(SVG_NS, 'path');
  var transform = svg.createSVGTransformFromMatrix(matrix);
  g.transform.baseVal.appendItem(transform);
                                                          
  path.pathSegList.appendItem(path.createSVGPathSegMovetoAbs(0, -3));
  path.pathSegList.appendItem(path.createSVGPathSegLinetoAbs(48, -3));
  path.pathSegList.appendItem(path.createSVGPathSegMovetoAbs(0, 3));
  path.pathSegList.appendItem(path.createSVGPathSegLinetoAbs(48, 3));
  
  g.appendChild(path);
  g.isRingBond = false;
  path.width = 48;
  return g;
}

function tripleBond(matrix) {
  var g = document.createElementNS(SVG_NS, 'g');
  g.setAttribute('class', 'tripleBond');
  var path = document.createElementNS(SVG_NS, 'path');
  var transform = svg.createSVGTransformFromMatrix(matrix);
  g.transform.baseVal.appendItem(transform);
                                                          
  path.pathSegList.appendItem(path.createSVGPathSegMovetoAbs(0, -3));
  path.pathSegList.appendItem(path.createSVGPathSegLinetoAbs(48, -3));
  path.pathSegList.appendItem(path.createSVGPathSegMovetoAbs(0, 0));
  path.pathSegList.appendItem(path.createSVGPathSegLinetoAbs(48, 0));
  path.pathSegList.appendItem(path.createSVGPathSegMovetoAbs(0, 3));
  path.pathSegList.appendItem(path.createSVGPathSegLinetoAbs(48, 3));
  
  g.appendChild(path);
  g.isRingBond = false;
  path.width = 48;
  return g;
}

function Ghosts(atom) {
  var g = document.createElementNS(SVG_NS, 'g');
  var matrix = svg.createSVGMatrix();
  
  var posarr = [];
  for (var i = 0; i < atom.bonds.length; i++) {
    posarr[posarr.length] = atom.bonds[i].pos;
  }
  if (atom.bondFrom)
    posarr[posarr.length] = (atom.bondFrom.pos + 6) % 12;
  
  
  for (var i = 0; i < 12; i++) {
    if (posarr.indexOf(i) !== -1)
      continue;
    var bond = drawTarget(matrix.rotate(i * 30));
    bond.pos = i;
    g.appendChild(bond);
  }
  
  g.id = 'ghosts';
  
  return g;
}
var ghosts;
//var molecule = Molecule();

function scrubEventBoxes() {
  for (var i = 0; i < eventG.children.length; i++) {
    if (!rootG.contains(eventG.children[i].elem)) {
      eventG.removeChild(eventG.children[i]);
      i--;
    }
  }
}

function removeAtom(atom) {
  if (atom.bondFrom)
    removeBond(atom.parentElement);
  else
    atom.parentElement.removeChild(atom);
}

function getMolecule(elem) {
  var molecule = elem;
  while (molecule.className.baseVal != 'molecule')
    molecule = molecule.parentElement;
  return molecule;
}

function ringBondLookup(molecule, bond) {
  for (var i = 0; i < molecule.rings.length; i++) {
    if (molecule.rings[i][0] === bond) 
      return i;
  }
  return -1;
}

function ringBondAtomLookup(molecule, atom) {
  var result = [];
  for (var i = 0; i < molecule.rings.length; i++) {
    if (molecule.rings[i][1] === atom) 
      result[result.length] = i;
    if (molecule.rings[i][2] === atom)
      result[result.length] = i;
  }
  return result;
}

function removeRingBond(bond) {
  var molecule = getMolecule(bond);
  var index = ringBondLookup(molecule, bond);
  if (bond.className.baseVal === 'singleBond') {
    molecule.rings[index][1].ringBonds--;
    molecule.rings[index][2].ringBonds--;
  } else if (bond.className.baseVal === 'doubleBond') {
    molecule.rings[index][1].ringBonds -= 2;
    molecule.rings[index][2].ringBonds -= 2;
  } else if (bond.className.baseVal === 'tripleBond') {
    molecule.rings[index][1].ringBonds -= 3;
    molecule.rings[index][2].ringBonds -= 3;
  }
  molecule.rings.splice(index, 1);  
  
  for (var i = 0; i < bond.parentElement.bonds.length; i++) {
    if (bond.parentElement.bonds[i] === bond) {
      bond.parentElement.bonds.splice(i, 1);
      break;
    }
  }
  bond.parentElement.removeChild(bond);
}

function removeBond(bond) {
  if (bond.isRingBond) 
    removeRingBond(bond);
  else {
    for (var i = 0; i < bond.parentElement.bonds.length; i++) {
      if (bond.parentElement.bonds[i] === bond) {
          bond.parentElement.bonds.splice(i, 1);
          break;
      }
    }
    bond.parentElement.removeChild(bond);
  }
}

function  calcExplicitH(elem) {
  if (elem.nodeName === 'text') {
    var newStr = elem.element;
    var valence = Global.VALENCES[elem.element];
        
    var subs = ['₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];
    var sups = ['¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];
    var supp = '⁺';
    var supm = '⁻';
      
    var bonded_e = 0;
    for (var i = 0; i < elem.parentElement.bonds.length; i++)
      if (elem.parentElement.bonds[i].className.baseVal === 'singleBond')
        bonded_e++;
      else if (elem.parentElement.bonds[i].className.baseVal === 'doubleBond')
        bonded_e += 2;
      else if (elem.parentElement.bonds[i].className.baseVal === 'tripleBond')
        bonded_e += 3;
          
    if (elem.parentElement.bondFrom)
      if (elem.parentElement.bondFrom.className.baseVal === 'singleBond')
        bonded_e++;
      else if (elem.parentElement.bondFrom.className.baseVal === 'doubleBond')
        bonded_e += 2;
      else if (elem.parentElement.bondFrom.className.baseVal === 'tripleBond')
        bonded_e += 3;
        
    bonded_e += elem.parentElement.ringBonds;        
      
    //var num_h = valence - bonded_e + elem.modifier;
    var num_h = elem.num_h;
      
    var h_str = '';
    if (num_h === 1)
      h_str += 'H';
    else if (num_h > 1)
      h_str += 'H'+subs[num_h - 2];
    newStr += h_str;
              
    var electrons = elem.electrons;
         
    elem.charge = valence - electrons - bonded_e - num_h;

    if (elem.element === 'C')    
      if (!elem.charge && bonded_e !== 0 && electrons == 0)
        newStr = '';   
    
    if (valence) {
      if (elem.charge === 1) {
        newStr += supp;
      } else if (elem.charge > 0) {
        newStr += supp + sups[elem.charge - 1];
      } else if (elem.charge === -1) {
        newStr += supm;
      } else if (elem.charge < 0) {
        newStr += supm + sups[elem.charge*-1 - 1];
      }
    }
    
    //>= 0 so electrons are removed if they existed previously
    if (electrons >= 0) {
      electrons = Electrons(electrons);
      electrons.setAttribute('transform', elem.getAttribute('transform'));
      if (elem.parentElement.electrons)
        elem.parentElement.removeChild(elem.parentElement.electrons);
      elem.parentElement.electrons = electrons;
      elem.parentElement.appendChild(electrons);
    }
    elem.textContent = newStr;
    return true;
  }
  return false;
}

function recurse(elem) {
  for (var i = 0; i < elem.childElementCount; i++) {
    if (!calcExplicitH(elem.children[i]))
      recurse(elem.children[i]);
  }
}

function isBond(elem) {
  return elem.className.baseVal === 'singleBond' ||
         elem.className.baseVal === 'doubleBond' ||
         elem.className.baseVal === 'tripleBond';
}

function isAtom(elem) {
  return elem.className.baseVal === 'atom';
}

function addEventBox(elem) {
  if (elem.eventBox)
    return;
    
  var eventBox = document.createElementNS(SVG_NS, 'rect');  
  var matrix = svg.getTransformToElement(elem);
  matrix = matrix.inverse();
  var transform = svg.createSVGTransformFromMatrix(matrix)      
  eventBox.transform.baseVal.initialize(transform);
  eventBox.onmouseenter = rectMouseEnter;
  eventBox.onmouseleave = rectMouseLeave;
  eventBox.onmousedown = rectMouseDown;
  eventBox.onmouseup = rectMouseUp;
  eventBox.onmousemove = rectMouseMove;
  
  if (isAtom(elem)) {  
    eventBox.x.baseVal.value = -5;
    eventBox.y.baseVal.value = -5;
    eventBox.width.baseVal.value = 10;
    eventBox.height.baseVal.value = 10;
  } else if (isBond(elem)) {
    var path = elem.firstElementChild;
    eventBox.x.baseVal.value = 3;
    eventBox.y.baseVal.value = -5;
    eventBox.width.baseVal.value = path.width - 5;
    eventBox.height.baseVal.value = 10;
  }
  
  eventG.appendChild(eventBox);
  
  elem.eventBox = eventBox;
  eventBox.elem = elem;
}

function genSMILES() {
  
   function recurse(child) {
    var resultArr = [];
    recurDepth++;
      
    for (var j = 0; j < child.childElementCount; j++) {
      if (child.children[j].className.baseVal === 'atom')
        resultArr = recurse(child.children[j]);
      else if (isBond(child.children[j])) {
        var arr = recurse(child.children[j]);
        arr.type = child.children[j].className.baseVal;
        resultArr.push(arr);
      } else if (child.children[j].nodeName === 'text') {      
        var str = '[' + child.children[j].element;
        if (child.children[j].num_h === 1) {
          str += 'H';
        } else if (child.children[j].num_h > 1) {
          str += 'H' + child.children[j].num_h;
        }
        
        if (child.children[j].charge === 1) {
          str += '+';
        } else if (child.children[j].charge > 0) {
          str += child.children[j].charge;
        } else if (child.children[j].charge === -1) {
          str += '-';
        } else if (child.children[j].charge < 0) {
          str += child.children[j].charge;
        }
        str += ']';
        
        if (child.ringBonds) {
          var rings = ringBondAtomLookup(getMolecule(child), child);
          for (var i = 0; i < rings.length; i++)
            str += (++rings[i]);
          
        }
        
        resultArr.push(str);
      }
    }
    return resultArr;
  }
 
  function arrToSmiles(arr) {
    if (arr[0]) {
      var result = arr[0];
    } else {
      var result = '';
    }
    
    for (var i = arr.length - 1; i > 0; i--) {
      if (i > 1) {
        var branch =  arrToSmiles(arr[i]);
        if (branch) {
          result += '(' +branch+ ')';
        }
      } else {
        result += arrToSmiles(arr[i]);
      }
    }
    
    if (arr.type === 'singleBond') {
      //result = '-' + result;
    } else if (arr.type === 'doubleBond') {
      result = '=' + result;
    } else if (arr.type === 'tripleBond') {
      result = '#' + result;
    }
    
    return result;
  }
  
  /*{atom,
   bonds = [atoms]}
  atom;
  for (int i = 0; i < bonds.length; i++)
    bonds[i].atom
  */
  
  /*function recurse(atom, depth) {
    var result = atom.element;
    var branches = [];
    for (var i = 0; i < atom.bonds.length; i++) {
      var branch = '';
      var bondType = atom.bonds[i].className.baseVal;
      if (bondType === 'doubleBond')
        branch += '=';
      else if (bondType === 'tripleBond')
        branch += '#';
      var branchObj = recurse(atom.bonds[i].atom, depth++);
      branches[i] = branchObj;
    }
    
    branches.sort(function(a, b) {
      return a.depth - b.depth;
    });
    for (var i = 0; i < branches.length; i++) {
      if (i > 0)
        result += '(' + branches[i] + ')';
      else
        result += branches[i];  
    }
    
    return {branch: result, depth: depth};  
  }
  */
  /*
  var arr1 = [];
  var atoms = 0;
  function recurse(child) {
    var resultStr = '';
    recurDepth++;
      
    var needBranch = true;
    child.bonds = 0;
    for (var j = 0; j < child.childElementCount; j++) {
      if (child.children[j].className.baseVal === 'atom')
        resultStr += child.children[j].currAtom;
      else if (child.children[j].className.baseVal === 'singleBond')
        if (child.bonds > 1){
          resultStr += '(' + recurse(child.children[j]) + ')';
        } else {
          resultStr += '' + recurse(child.children[j]);
          needBranch=true;
        }     
          
      else if (child.children[j].className.baseVal === 'doubleBond')
        if (needBranch){
          resultStr += '(=' + recurse(child.children[j]) + ')';
        } else {
          resultStr += '=' + recurse(child.children[j]);
          needBranch=true;
        }
      else if (child.children[j].className.baseVal === 'tripleBond')
        if (needBranch){
          resultStr += '(#' + recurse(child.children[j]) + ')';
        } else {
          resultStr += '#' + recurse(child.children[j]);
          needBranch=true;
        }
      else if (child.children[j].nodeName === 'text')
        resultStr += '' + child.children[j].textContent + '';
    }
    return resultStr;
  }*/
  
  function longestBranch(str) {
    var searchStr = '';
    do {
      searchStr += ')';      
    } while(str.indexOf(searchStr) > -1);
    return searchStr.length - 1;
  }
  
  var molecules = document.getElementsByClassName('molecule');
  /*var genStr = "";
  for (var i = 0; i < molecules.length; i++) {
    var molecule = molecules[i];
    
    if (i > 0)
      genStr += ",";    
    
    genStr += recurse(molecule);
   
  }*/
  
  var recurDepth = -1;
  var genStr = '';
  if (molecules.length) {
     genStr = recurse(molecules[0]);
     genStr = arrToSmiles(genStr);
     var endChar = genStr.slice(-1);
     var swap = endChar === '-' || endChar === '=' || endChar === '#';
     if (swap) {
       
       genStr = genStr.slice(0, -2) + genStr.slice(-2).split('').reverse().join('');
       
     }
  }
    
  console.log(genStr);
  document.getElementById('result').textContent = genStr + "\n";
    //+ recurDepth;
  
  
  
}






















/////DEPRECATED///////


function textMouseEnter(event) {
  //if (!ghosts) {
  if (this.parentElement.children[0] !== ghosts) {
    if (ghosts)
      ghosts.parentElement.removeChild(ghosts);
    if (this.parentElement.parentElement.className.baseVal === 'molecule')
      ghosts = Ghosts();
    else
      ghosts = Ghosts(4);
    this.parentElement.insertBefore(ghosts, this.firstElementChild);    
  }
  //}
  //if (event)
    //event.stopPropagation();
}

//mouse position is updated into x and y
var x, y;
var colliding = {
  element: null
};
//colliding.prototype.valueOf = function () { return !!this.element; };
var cursor = document.getElementById('cursor');
cursor.cx.baseVal.value = svg.width.baseVal.value / 2;
cursor.cy.baseVal.value = svg.height.baseVal.value / 2;

function getMousePos(event) {
  x = event.clientX - SVG_OFFSET_LEFT;
  y = event.clientY - SVG_OFFSET_TOP;
  //cursor.cx.baseVal.value = x;
  //cursor.cy.baseVal.value = y;
}

function updateCursor(event) {
  if (event.webkitMovementX) {
    cursor.cx.baseVal.value += event.webkitMovementX;
    cursor.cy.baseVal.value += event.webkitMovementY;
  } else if (event.mozMovementX) {
    cursor.cx.baseVal.value += event.mozMovementX;
    cursor.cy.baseVal.value += event.mozMovementY;
  }
  
}
var mouseGhost;

function textMouseLeave(event) {
  if (ghosts)
   if (this === ghosts.parentElement) {
    //this.removeChild(ghosts);
    }
}

function textMouseDown(event) {
  if (event.button === 0) {
    if (event.eventPhase === 2) {
      add_h?this.modifier++:this.modifier--;
      recurse(rootG);
    }
  }
}




function mouseMove2(event) {
  getMousePos(event);
  
  if (!mouseGhost && !ghosts) {
    mouseGhost = document.createElementNS(SVG_NS, 'g');
    mouseGhost.setAttribute('transform', 'translate('+x+', '+y+')');
    
    var circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('r', 10);
    
    circle.onmouseover = function (event) {
      var g = document.createElementNS(SVG_NS, 'g');
      g.id = 'ghosts';
      var matrix = svg.createSVGMatrix().translate(x, y);
      for (var i = 0; i < 8; i++) {
        //OPTIMIZE USE REPLACECHILD
        g.appendChild(drawTarget(matrix.rotate(i * 45)));
      }
      rootG.appendChild(g);
      mouseGhost.ghosts = g;
    }
    
    circle.onmouseout = function (event) {
      rootG.removeChild(mouseGhost.ghosts);
      mouseGhost.ghosts = null;
    }
    
    text = document.createElementNS(SVG_NS, 'text');
    text.textContent = 'C';
    text.id = 'ghost';
    
    text.onclick = function (event) {
      if (this.id === 'ghost') {
        
        this.onmouseover = function(event) {
          
          if (!this.onmouseout) {
            this.onmouseout = function(event) {
              this.parentElement.removeChild(ghosts);
              ghosts = null;
            }
          }
          
          rootG.removeChild(mouseGhost);
          mouseGhost = null;
          //add ghosts
          var g = document.createElementNS(SVG_NS, 'g');
          g.id = 'ghosts';
          var matrix = svg.createSVGMatrix().translate(x, y);
          for (var i = 0; i < 8; i++) {
            //OPTIMIZE USE REPLACECHILD
            g.appendChild(drawTarget(matrix.rotate(i * 45)));
          }
          ghosts = g;
          this.parentElement.appendChild(g);
        }
        
        
    
        rootG.appendChild(mouseGhost);
        mouseGhost = null;
      }
    }
    
    
    
    //mouseGhost.appendChild(text);
    //mouseGhost.appendChild(circle);
    
    rootG.appendChild(mouseGhost);
  } else if (!ghosts) {
    mouseGhost.setAttribute('transform', 'translate('+x+', '+y+')');
  }
  
  /*if (colliding.element){
    //TODO: crude
    if (Math.sqrt(Math.pow(x - colliding.x, 2) + Math.pow(y - colliding.y, 2)) > 80) {
      
      colliding.element.id = '';
      colliding.element = null;
    }
  } else if (!ghosts || Math.sqrt(Math.pow(x - ghosts.x, 2) + Math.pow(y - ghosts.y, 2)) > 53) {
    createGhosts();
    checkCollisions();
  }*/
}

function mouseDown(event) {
  //this.parentElement.id = 'target';
  rootG.appendChild(this.parentElement);
  killGhosts();
}



/*
 * 
 *
 * Input: 
 *   event is MouseEvent
 */
function addBond(event) {
  //TODO: export element creation into helper function
  var g = document.createElementNS(SVG_NS, 'g');
  g.id = 'moreghosts';
  var matrix = svg.createSVGMatrix().translate(x, y);
  for (var i = 0; i < 8; i++) {
    //OPTIMIZE USE REPLACECHILD
    g.appendChild(drawTarget(matrix.rotate(i * 45)));
  }
  var path = document.createElementNS(SVG_NS, 'path');  
  g.appendChild(path);
  event.target.parentElement.appendChild(g);
  
  
}

/*
 * Creates the ghosts that follow the cursor
 */
function createGhosts() {
  var g = document.createElementNS(SVG_NS, 'g');
  g.id = 'ghosts';
  var matrix = svg.createSVGMatrix().translate(x, y);
  for (var i = 0; i < 8; i++) {
    //OPTIMIZE USE REPLACECHILD
    g.appendChild(drawTarget(matrix.rotate(i * 45)));
  }
  if (ghosts) {
    rootG.replaceChild(g, ghosts);
    ghosts = g;
  } else {
    //ghosts = rootG.insertBefore(g, cursor);
    ghosts = rootG.appendChild(g);
  }
  ghosts.x = x;
  ghosts.y = y;
}

function addGhosts(event) {
  if (this.parentElement.parentElement.id !== 'ghosts') {
    createGhosts();
  }
}

function killGhosts() {
  
    rootG.removeChild(ghosts);
    ghosts = null;
  
}

//isPointinPath/getIntersectionList
SVGGraphicsElement.prototype.getTransformedBBox = function() {
  this.getBBox();
  this.getCTM();
}

function checkCollisions() {
  //getBBox() gets current user coordinates
  //so we invert transformation matrix to svg
  for (var i = 0, len = ghosts.childElementCount; i < len; i++) {
    
    //gets the transform from [i], inverts it, and applies it to rootG
    var matrix = ghosts.children[i].transform.baseVal.getItem(0).matrix;
    var inverseMatrix = matrix.inverse();
    var transform = svg.createSVGTransformFromMatrix(inverseMatrix);
    rootG.transform.baseVal.initialize(transform);
      
    var collisions = svg.getIntersectionList(ghosts.children[i].children[0].getStrokeBBox(), null);
    
    //console.log(collisions.length);
    for (var j = 0; j < collisions.length; j++){
      if (collisions.item(j).nodeName === 'path'){
        //TODO: can we skip this by predicting structure of collisions?
        if (collisions.item(j) !== ghosts.children[i].children[0]) {
          colliding.element = collisions.item(j)
        }
      }
    }
    //console.log(collisions);
    //console.log(j);
    
    if (colliding.element) {
      
      killGhosts();
      
      colliding.element = colliding.element.parentElement;
      //colliding.element.id = 'target';
      //colliding.x = x;
      //colliding.y = y;
      break;
      
      /*
      //avoid polling collisions NodeList twice
      var pathSeg = collisions.item(1).pathSegList.getItem(0);
      
      //transform to initial coordinates
      var svgPoint = svg.createSVGPoint();
      svgPoint.x = pathSeg.x;
      svgPoint.y = pathSeg.y;
      svgPoint = svgPoint.matrixTransform(matrix);
      console.log(svgPoint);
      x = svgPoint.x;
      y = svgPoint.y;
      cursor.cx.baseVal.value = x;
      cursor.cy.baseVal.value = y;
      
      //reset transform
      rootG.transform.baseVal.clear();
      createGhosts();
      return;*/
    }
  }
  rootG.transform.baseVal.clear();
}