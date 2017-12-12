import create_canvas from './cytoscape_init';
import new_remove from './new_remove';
import undoRedo from 'cytoscape-undo-redo';
import cytoscape from 'cytoscape';
import Mousetrap from 'mousetrap';
import colormap from 'colormap';


function buildEditor() {
  var cy = create_canvas();
  undoRedo(cytoscape);

  // Register undo/redo, and other imported functions
  var ur = cy.undoRedo();
  cytoscape('collection', 'delete', new_remove);
  ur.action("deleteEles", eles => {eles.delete()
                                    return eles}, eles => {console.log(eles);
                                                          eles.restore()});

  // =====================
  // || GRAPH FUNCTIONS ||
  // =====================

  function newNode(pos) {
    // var name = getName()
    //if (!(name === null)) {
    var color = getColor(name)
    var createdNode = cy.add({group: 'nodes',
                        position: pos,
                        data: {'variable': false,
                        'name': "",
                        'defaultColor': color}
                      });
    cy.$().deselect();
    createdNode.select();
    return createdNode
    //}
  };

  function newEdge(origin, dest) {
    var newEdge = cy.add({
            group: "edges",
            style: {'target-arrow-shape': 'triangle'},
            data: {source: origin.id(),
                   target: dest.id(),
                   name: name},
            selectable: true
          });
    fixParent(dest);
    //origin.setParent(dest.parent())
    origin.deselect();
    dest.select();
    return newEdge
  };

  function fixParent(dest) {
    // set origin's parent to dest's parent,
    // and the same for everything origin is attached to.
    var incomers = dest.predecessors("node");
    if (incomers.length > 0) {
      incomers.setParent(dest.parent());
    }
  }

  function getColor(name, node=null) {
    // Method to generate a color for the node that the method is called on.
    function isString(name) {
      function matchBrackets(bra, n) {
        return (n[0] == bra && n[n.length - 1] == bra);}
      return (matchBrackets('\'', name) || matchBrackets('\"', name) || matchBrackets('\`', name))
    }

    if (name != "") {
      if (node === null) {var sameNamedEles = cy.$("[name='" + name + "']");}
      else {var sameNamedEles = cy.$("[name='" + name + "']").difference(node);}

      // Look for something named the same, and make this node the same color.
      if (sameNamedEles.length > 0 && name != "") {
        return sameNamedEles.data("defaultColor");
      }
      // If the name represents a string, make the node green.
      else if (isString(name)) {
        return 'lime';
      }
      // We want numbers (including floats, ints, etc) to be one color.
      else if (!isNaN(name)) {
        return 'blue';
      }
    }

    // Else generate a random color from a colormap (and convert it to hash).
    var ncolors = 72
    var index = Math.floor(Math.random() * ncolors);
    return colormap('prism', 72, 'hex')[index];

    //'#' + interpolateLinearly(Math.random(), prism).map(x => Math.floor(255 * x).toString(16).padStart(2, "0")).join("");
  }
  cytoscape('collection', 'getColor', function() {return getColor(this.data('name'), this)});

  function setColor() {
    var color = this.getColor();
    this.data('defaultColor', color);
  }
  cytoscape('collection', 'setColor', setColor);

  function rename(node, newName=null) {
    if (newName === null) {
      newName = getName();
    }
    if (!(newName === null)) {
      node.data('name', newName);
      node.setColor()
    }
  };
  cytoscape('collection', 'rename', function(newName=null) {rename(this, newName=newName)});

  function setParent(newParent) {
    if (newParent != null && newParent.id()) {
    ur.do("changeParent", {"parentData": newParent.id(), "nodes": this,
  "posDiffX": 0, "posDiffY": 0});
    }
    else {
      var oldParent = this.parent()
      ur.do("changeParent", {"parentData": null, "nodes": this,
    "posDiffX": 0, "posDiffY": 0});
      if (oldParent.length > 0 && oldParent.children().length == 0) {
        oldParent.remove()
      }
    }
  }
  cytoscape('collection', 'setParent', setParent);

  function toggleVariable () {
    this.data('variable', (!this.data('variable')))
  }
  cytoscape('collection', 'toggleVariable', toggleVariable);

  // =========================
  // || USER INPUT HANDLERS ||
  // =========================

  function getName() {
    var newName = window.prompt("name:", "")
    var keys_pressed = new Set();
    return newName
  }

  // Double-tap to add a new node, or press n
  var mousePosition = {x:0, y:0};
  document.addEventListener('mousemove', function(mouseMoveEvent){
    mousePosition.x = mouseMoveEvent.pageX;
    mousePosition.y = mouseMoveEvent.pageY;
  }, false);

  Mousetrap.bind('n', function(e) {
    // If all of them belong to the same parent, take them out of the parent.
      var pos = mousePosition;
      newNode(Object.assign({}, pos));
  });

  var dclick_prevTap;
  var dclick_tappedTimeout;

  cy.on('tap', function(event) {
    var tap_target = event.target;
    if(tap_target === cy && keys_pressed.has('e')){
      // Click on the background with 'e'
      newNode(event.position);
      dclick_tappedTimeout = false;
    }

    if (dclick_tappedTimeout && dclick_prevTap) {
      clearTimeout(dclick_tappedTimeout);
    }
    // If double clicked:
    if(dclick_prevTap === tap_target) {
      if(tap_target === cy){
        newNode(event.position);
      }
      else {
        rename(event.target);
      }
      dclick_prevTap = null;
    } else {
      // Update doubleclick handlers
      dclick_tappedTimeout = setTimeout(function(){ dclick_prevTap = null; }, 300);
      dclick_prevTap = tap_target;
    }
  });

  // Hold 'e' and tap a node to make a new edge
  cy.on('tap', 'node', function(event) {
    var sources = cy.$('node:selected').difference(event.target)
    if (sources.length > 0 && keys_pressed.has('e')) {
      sources.map(source => newEdge(source, event.target))
      event.target.select()
    }
  });

  // Hold 'r' and tap a node to rename it.
  cy.on('tap', 'node, edge', function(event) {
    var sources = cy.$('node:selected').difference(event.target)
    if (keys_pressed.has('r')) {
      event.target.rename()
    }
  });

  // l to 'lambda': wrap selection in a hypernode, containing the selection
  // and its closed neighbourhood, corresponding to a lambda function.
  Mousetrap.bind('l', function() {
    // If all of them belong to the same parent, take them out of the parent.
      var selected = cy.$('node:selected');
      if (selected.parents().length == 1) {
        selected.setParent(null);
      }
      else {
        var parent = newNode();
        var componentz = selected.closedNeighbourhood() ;

        componentz.forEach(function(component){
          component.setParent(parent);
          })
        selected.deselect();
        parent.select();
      }
      var selected = cy.$('node:selected');
      console.log("fixing parent for", selected)
      fixParent(selected);


    },
    'keypress');

  // Backspace to delete selection
  Mousetrap.bind('backspace', function() { ur.do("deleteEles", cy.$(':selected'))}); //.delete ();});

  Mousetrap.bind('V', function() { cy.$(':selected').toggleVariable();});
  Mousetrap.bind('P', function() { toLisp(cy.$(':selected'));});
  Mousetrap.bind('Z', function() { ur.undo();});


  // Recognise keys pressed down
  var keys_pressed = new Set()
  Mousetrap.bind('e', function() { keys_pressed.add('e');}, 'keypress');
  Mousetrap.bind('e', function() { keys_pressed.delete('e');}, 'keyup');
  Mousetrap.bind('r',
    function() {
      keys_pressed.add('r');
      var selected = cy.$(':selected');
      if (selected.length == 1) {
        selected.rename();
        keys_pressed.delete('r');
      }
    }, 'keypress');
  Mousetrap.bind('r', function() { keys_pressed.delete('r');}, 'keyup');

  function loadState(objectId) {
    var x = document.getElementById(objectId).files[0];
    var reader = new FileReader();
    reader.onload = function(e) {
      var graphString = e.target.result;
      var graphJson = JSON.parse(graphString);
      console.log(graphJson)
      cy.json(graphJson);
    }
    reader.readAsText(x, "UTF-8");
  }

  function saveState() {
    var fileName = window.prompt("File name:", "")
    if (!(fileName === null)) {
      var jsonData = JSON.stringify(cy.json())
      var a = document.createElement("a");
      var file = new Blob([jsonData], {type: 'text/plain'});
      a.href = URL.createObjectURL(file);
      a.download = fileName + '.txt';
      a.click();
    }
  }

  function resetGraph() {
    if (confirm("REALLY CLEAR ALL? (There's no autosave and no undo!)")) {
      console.log("RESET")
      cy.remove(cy.$(""));
    }
  }

  return {'cy': cy,
          'loadState': loadState,
          'saveState': saveState,
          'resetGraph': resetGraph}
}



module.exports = buildEditor;
