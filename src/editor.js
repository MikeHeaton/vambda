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
    return createdNode
  }

  function newEdge (origins, dest) {
    var newEdges = origins.map(source => {
      cy.add({
        group: 'edges',
        style: {'target-arrow-shape': 'triangle'},
        data: {
          source: source.id(),
          target: dest.id(),
          name: ''
        },
        selectable: true
      })
    })
    return newEdges
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
    return cy.$id(this.id())
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
  var dclickPrevTap
  var dclickTappedTimeout
  var eSelected
  // Track mouse position
  var mousePosition = {x: 0, y: 0}
  document.addEventListener('mousemove', function (mouseMoveEvent) {
    mousePosition.x = mouseMoveEvent.pageX
    mousePosition.y = mouseMoveEvent.pageY
  }, false)

  // __Handlers for clicking on the background__
  // Double-tap or single-tap with 'e'/'w' to add a new node.
  cy.on('tap', function (event) {
    var tapTarget = event.target
    if (tapTarget === cy) {

      if (keysPressed.has('e')) {
        // Click on the background with 'e'

        var n = newNode(event.position)

        dclickTappedTimeout = false
        if (eSelected.length > 0 && eSelected.parent().length <= 1) {
          newEdge(eSelected, n)
          n = n.setParent(eSelected.parent())
        }
        selectOnly(n)
      }
      else if (tapTarget === cy && keysPressed.has('w')) {
        // Click on the background with 'e'
        var n = newNode(event.position)
        dclickTappedTimeout = false
        if (eSelected.length === 1) {
          newEdge(n, eSelected)
          n = n.setParent(eSelected.parent())
        }
        selectOnly(eSelected)
      }
      else if (dclickTappedTimeout && dclickPrevTap) {
        clearTimeout(dclickTappedTimeout)
      }
      // If double clicked:
      if (dclickPrevTap === tapTarget && dclickTappedTimeout) {
        var n = newNode(event.position)
        selectOnly(n)
        dclickPrevTap = null
      }

    }
  else {
    if (tapTarget.isNode() && dclickTappedTimeout && dclickPrevTap) {
      clearTimeout(dclickTappedTimeout)
    }
    // If double clicked:
    if (dclickPrevTap === tapTarget && dclickTappedTimeout) {
      rename(tapTarget)
    }
  }

  // Update doubleclick handlers
  dclickTappedTimeout = setTimeout(function(){ dclickPrevTap = null }, 300)
  dclickPrevTap = tapTarget
  })

  // Hold 'e/w' and tap a node to make a new edge
  cy.on('tap', 'node', function (event) {
    console.log(event.target)
    var target = event.target
    var sources = cy.$('node:selected').difference(event.target)
    if (sources.length > 0) {
      if (keysPressed.has('e')) {
        newEdge(sources, target)
        selectOnly(target)
        sources.connectedClosure().setParent(target.parent())
      }
      else if (keysPressed.has('w')) {
        sources.map(source => newEdge(target, source))

        sources = sources.connectedClosure().setParent(target.parent())
        console.log(sources)
        selectOnly(sources)
      }


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
        var closure = selected.connectedClosure()
        closure.setParent(parent)
        selectOnly(parent)
      }
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
        var closure = selected.connectedClosure()
        parent.rename()
        closure.setParent(parent)
        selectOnly(parent)

      }
    },
    'keypress')

  // Backspace to delete selection
  Mousetrap.bind('backspace', function() { ur.do('deleteEles', cy.$(':selected'))}) //.delete ()})

  Mousetrap.bind('V', function() { cy.$(':selected').toggleVariable()})
  Mousetrap.bind('P', function() { toLisp(cy.$(':selected'))})
  Mousetrap.bind('Z', function() { ur.undo()})


  // Recognise keys pressed down
  var keysPressed = new Set()
  Mousetrap.bind('e', function() {
    keysPressed.add('e')
    eSelected = cy.$('node:selected')
  },
  'keypress')
  Mousetrap.bind('e', function() { keysPressed.delete('e')}, 'keyup')

  Mousetrap.bind('w', function() {
    keysPressed.add('w')
    eSelected = cy.$('node:selected')
  },
  'keypress')
  Mousetrap.bind('w', function() { keysPressed.delete('w')}, 'keyup')

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

      // We HAVE to double-load elements here: once to get them into the
      // graph, and once to set their parents correctly. If we don't, when
      // elements are loaded and don't have a parent in place already,
      // not only do they set the parent to 'undefined', they also
      // _edit the fucking json_ so that the parent is thereafter undefined.
      //
      // That means that if you try to use the same JSON object twice for the
      // two loads, it WON'T WORK because it's been modified by the first.
      // WHAT THE HELL, CYTOSCAPE??? (Yes I lost several hours to this bug.)
      cy.json(JSON.parse(graphString))
      JSON.parse(graphString).elements.nodes.map(function (jsn) {
        var nodeId = jsn.data.id
        var nodeParent = jsn.data.parent
        cy.$id(nodeId).setParent(cy.$id(nodeParent))
      })

    }
    reader.readAsText(x, 'UTF-8')
  }

  function saveState() {
    var fileName = window.prompt("File name:", "")
    if (!(fileName === null)) {
      var jsonData = JSON.stringify(
        {'elements': cy.json()['elements']}
      )
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
  canvas.setAttribute("id", "drawCanvas")
  /*console.log(document.getElementById("drawCanvas"))

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
  });*/

  function selectOnly(ele) {
    cy.$().deselect()
    ele.select()
  }

  function connectedClosure() {
    // Returns the closure (union with all-depth family) of the eles.
    var nextLevel = this.closedNeighborhood('node')
    if (nextLevel.length === this.length) {
      return this
    } else {
      return nextLevel.connectedClosure()
    }
  }
  cytoscape('collection', 'connectedClosure', connectedClosure)



  return {'cy': cy,
    'loadState': loadState,
    'saveState': saveState,
    'resetGraph': resetGraph}
}

module.exports = buildEditor
