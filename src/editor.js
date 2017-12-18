import createCanvas from './cytoscape_init'
import newRemove from './newRemove'
import undoRedo from 'cytoscape-undo-redo'
import cytoscape from 'cytoscape'
import Mousetrap from 'mousetrap'
import colormap from 'colormap'
import cyCanvas from 'cytoscape-canvas'
import * as fab from 'fabric'

function buildEditor () {
  var cy = createCanvas()
  undoRedo(cytoscape)
  cyCanvas(cytoscape)

  // Register undo/redo, and other imported functions
  var ur = cy.undoRedo()
  cytoscape('collection', 'delete', newRemove)
  ur.action('deleteEles',
    eles => {
      eles.delete()
      return eles
    },
    eles => {
      console.log(eles)
      eles.restore()
    })

  // =====================
  // || GRAPH FUNCTIONS ||
  // =====================
  function setType (ele, newtype) {
    ele.data('type', newtype)
  }
  cytoscape('collection', 'setType', function (newType) { setType(this, newType) })

  function newNode (pos) {
    var color = getColor()
    var createdNode = cy.add({
      group: 'nodes',
      position: pos,
      data: {
        'variable': false,
        'name': '',
        'type': 'Free',
        'defaultColor': color
      }
    })
    cy.$().deselect()
    createdNode.select()
    return createdNode
  }

  function newEdge (origin, dest) {
    var newEdge = cy.add({
      group: 'edges',
      style: {'target-arrow-shape': 'triangle'},
      data: {
        source: origin.id(),
        target: dest.id(),
        name: ''
      },
      selectable: true
    })
    fixParent(dest)
    origin.deselect()
    dest.select()
    return newEdge
  }

  function fixParent (dest) {
    // set origin's parent to dest's parent,
    // and the same for everything origin is attached to.
    var incomers = dest.predecessors('node')
    if (incomers.length > 0) {
      incomers.setParent(dest.parent())
    }
  }

  function getColor (name = '', node = null) {
    // Method to generate a color for the node that the method is called on.
    function isString (name) {
      function matchBrackets (bra, n) {
        return (n[0] === bra && n[n.length - 1] === bra)
      }
      return (matchBrackets('\'', name) || matchBrackets('"', name) || matchBrackets('`', name))
    }

    if (name !== '') {
      if (node === null) {
        var sameNamedEles = cy.$("[name='" + name + "']")
      } else {
        var sameNamedEles = cy.$("[name='" + name + "']").difference(node)
      }

      // Look for something named the same, and make this node the same color.
      if (sameNamedEles.length > 0 && name !== '') {
        return sameNamedEles.data('defaultColor')
      } else if (isString(name)) {
      // If the name represents a string, make the node green.
        return 'lime'
      } else if (!isNaN(name)) {
      // We want numbers (including floats, ints, etc) to be one color.
        return 'blue'
      }
    }

    // Else generate a random color from a colormap (and convert it to hash).
    var ncolors = 72
    var index = Math.floor(Math.random() * ncolors)
    var col = colormap('nature', ncolors, 'hex')[index]
    console.log(col)
    return col
  }
  cytoscape('collection', 'getColor', function () { return getColor(this.data('name'), this) })

  function setColor () {
    var color = this.getColor()
    this.data('defaultColor', color)
  }
  cytoscape('collection', 'setColor', setColor)

  function rename (node, newName = null) {
    if (newName === null) {
      newName = getName()
    }
    if (!(newName === null)) {
      node.data('name', newName)
      node.setColor()
    }
  }
  cytoscape('collection', 'rename', function(newName=null) {rename(this, newName=newName)})

  function setParent(newParent) {
    // Set self's parent to newParent.
    if (newParent != null && newParent.id()) {
      ur.do("changeParent", {"parentData": newParent.id(),
                             "nodes": this,
                             "posDiffX": 0,
                             "posDiffY": 0})
    }
    else {
      // If newParent is null, remove the parent from the node.
      var oldParent = this.parent()
      ur.do('changeParent', {
        'parentData': null,
        'nodes': this,
        'posDiffX': 0,
        'posDiffY': 0})
      // Remove childless parents
      if (oldParent.length > 0 && oldParent.children().length === 0) {
        oldParent.remove()
      }
    }
  }
  cytoscape('collection', 'setParent', setParent)

  function toggleVariable () {
    switch (this.data('type')) {
      case 'Free':
        this.setType('NearBoundVariable')
        break
      case 'NearBoundVariable':
        this.setType('FarBoundVariable')
        break
      case 'FarBoundVariable':
        this.setType('Free')
        break
    }
  }
  cytoscape('collection', 'toggleVariable', toggleVariable)

  // =========================
  // || USER INPUT HANDLERS ||
  // =========================

  function getName () {
    var newName = window.prompt('name:', '')
    var keysPressed = new Set()
    return newName
  }

  // Double-tap to add a new node, or press n
  var mousePosition = {x: 0, y: 0}
  document.addEventListener('mousemove', function (mouseMoveEvent) {
    mousePosition.x = mouseMoveEvent.pageX
    mousePosition.y = mouseMoveEvent.pageY
  }, false)

  Mousetrap.bind('n', function (e) {
    var pos = mousePosition
    newNode(Object.assign({}, pos))
  })

  var dclickPrevTap
  var dclickTappedTimeout

  cy.on('tap', function (event) {
    var tapTarget = event.target
    if (tapTarget === cy && keysPressed.has('e')) {
      // Click on the background with 'e'
      newNode(event.position)
      dclickTappedTimeout = false
    }

    if (dclickTappedTimeout && dclickPrevTap) {
      clearTimeout(dclickTappedTimeout)
    }
    // If double clicked:
    if (dclickPrevTap === tapTarget) {
      if (tapTarget === cy) {
        newNode(event.position)
      } else {
        rename(event.target)
      }
      dclickPrevTap = null
    } else {
      // Update doubleclick handlers
      dclickTappedTimeout = setTimeout(function(){ dclickPrevTap = null }, 300)
      dclickPrevTap = tapTarget
    }
  })

  // Hold 'e' and tap a node to make a new edge
  cy.on('tap', 'node', function (event) {
    var sources = cy.$('node:selected').difference(event.target)
    if (sources.length > 0 && keysPressed.has('e')) {
      sources.map(source => newEdge(source, event.target))
      event.target.select()
    }
  })

  // Hold 'r' and tap a node to rename it.
  cy.on('tap', 'node, edge', function (event) {
    if (keysPressed.has('r')) {
      event.target.rename()
    }
  })

  // l to 'lambda': wrap selection in a hypernode, containing the selection
  // and its closed neighbourhood, corresponding to a lambda function.
  Mousetrap.bind('l', function () {
    // If all of them belong to the same parent, take them out of the parent.
      var selected = cy.$('node:selected')
      if (selected.parents().length == 1) {
        selected.setParent(null)
      }
      else {
        var parent = newNode()
        parent.setType('Lambda')
        var componentz = selected.closedNeighbourhood()

        componentz.forEach(function(component){
          component.setParent(parent)
          })
        selected.deselect()
        parent.select()
      }
      var selected = cy.$('node:selected')
      console.log('fixing parent for', selected)
      fixParent(selected)
    },
    'keypress')

  // d to 'define': wrap selection in a hypernode, containing the selection
  // and its closed neighbourhood, corresponding to a define statement.
  Mousetrap.bind('d', function() {
    // If all of them belong to the same parent, take them out of the parent.
      var selected = cy.$('node:selected')
      if (selected.parents().length == 1) {
        selected.setParent(null)
      }
      else {
        var parent = newNode()
        parent.setType('Define')
        var componentz = selected.closedNeighbourhood()

        componentz.forEach(function(component){
          component.setParent(parent)
          })
        selected.deselect()
        parent.select()
      }
      var selected = cy.$('node:selected')
      console.log('fixing parent for', selected)
      fixParent(selected)
    },
    'keypress')

  // Backspace to delete selection
  Mousetrap.bind('backspace', function() { ur.do('deleteEles', cy.$(':selected'))}) //.delete ()})

  Mousetrap.bind('V', function() { cy.$(':selected').toggleVariable()})
  Mousetrap.bind('P', function() { toLisp(cy.$(':selected'))})
  Mousetrap.bind('Z', function() { ur.undo()})


  // Recognise keys pressed down
  var keysPressed = new Set()
  Mousetrap.bind('e', function() { keysPressed.add('e')}, 'keypress')
  Mousetrap.bind('e', function() { keysPressed.delete('e')}, 'keyup')
  Mousetrap.bind('r',
    function () {
      keysPressed.add('r')
      var selected = cy.$(':selected')
      if (selected.length === 1) {
        selected.rename()
        keysPressed.delete('r')
      }
    }, 'keypress')
  Mousetrap.bind('r', function () { keysPressed.delete('r') }, 'keyup')

  function loadState (objectId) {
    var x = document.getElementById(objectId).files[0]
    var reader = new FileReader()
    reader.onload = function (e) {
      var graphString = e.target.result
      var graphJson = JSON.parse(graphString)
      console.log(graphJson)
      cy.json(graphJson)
    }
    reader.readAsText(x, 'UTF-8')
  }

  function saveState() {
    var fileName = window.prompt("File name:", "")
    if (!(fileName === null)) {
      var jsonData = JSON.stringify(
        {'elements': cy.json()['elements']}
      )
      //console.log("keys:", jsonData.keys)
      var a = document.createElement("a");
      var file = new Blob([jsonData], {type: 'text/plain'});
      a.href = URL.createObjectURL(file);
      a.download = fileName + '.txt';
      a.click();
    }
  }

  function resetGraph () {
    if (confirm("REALLY CLEAR ALL? (There's no autosave and no undo!)")) {
      console.log('RESET')
      cy.remove(cy.$(''))
    }
  }

  var layer = cy.cyCanvas({
    zIndex: 10,
    pixelRatio: "auto",
  })
  var canvas = layer.getCanvas()
  canvas.setAttribute("id", "drawCanvas");
  console.log(document.getElementById("drawCanvas"))

  var ctx = canvas.getContext('2d')

  cy.on("render cyCanvas.resize", function(evt) {
      layer.resetTransform(ctx);
      layer.clear(ctx);

      // Draw fixed elements
      ctx.fillRect(0, 0, 100, 100); // Top left corner
      layer.setTransform(ctx)
      // Draw model elements
      cy.nodes().forEach(function(node) {
          var pos = node.position();
          ctx.fillRect(pos.x, pos.y, 100, 100); // At node position
      });
  });



  return {'cy': cy,
    'loadState': loadState,
    'saveState': saveState,
    'resetGraph': resetGraph}
}

module.exports = buildEditor
