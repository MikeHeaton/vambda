import createCanvas from './cytoscape_init'
import newRemove from './newRemove'
import undoRedo from 'cytoscape-undo-redo'
import cytoscape from 'cytoscape'
import Mousetrap from 'mousetrap'
import colormap from 'colormap'
import cyCanvas from 'cytoscape-canvas'
import * as comments from './commentsCanvas'
import * as utils from './utils'

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

  var commentPoints = new comments.CommentsCanvas(cy)
  var commentMode = false

  // =====================
  // || GRAPH FUNCTIONS ||
  // =====================
  function setType (ele, newtype) {
    ele.data('type', newtype)
  }
  cytoscape('collection', 'setType', function (newType) { setType(this, newType) })

  function newNode (pos) {
    var createdNode = cy.add({
      group: 'nodes',
      position: pos,
      data: {
        'variable': false,
        'name': '',
        'type': 'Free',
        'defaultColor': 'black'
      }
    })
    createdNode.setColor()
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

  function getRandomColor() {
    // Generate a random color from a colormap (and convert it to hash).
    var ncolors = 72
    var index = Math.floor(Math.random() * ncolors)
    var col = colormap('nature', ncolors, 'hex')[index]
    return col
  }

  function getColor (node) {
    /* Takes a node. Returns a color for the node according to these rules:
     * All strings will be green
     * All numbers will be blue
     * Nodes with the same name will have the same color
     * Otherwise, make the node a random color.
     */
     var name = node.data('name')

    function isString (name) {
      // Detects whether the name represents a string
      /*function matchBrackets (bra, n) {
        return (n[0] === bra && n[n.length - 1] === bra)
      }
      return (matchBrackets('\'', name) || matchBrackets('"', name) || matchBrackets('`', name))*/
      return (name.match(RegExp("^\'.*\'$")) || name.match(RegExp('^\".*\"$')) || name.match(RegExp("^\`.*\`$")))
    }

    if (name !== '') {
      if (isString(name)) {
        // If the name represents a string, make the node green.
        return 'lime'
      } else if (!isNaN(name)) {
        // If the name represents a number (including floats, ints, etc), make it blue.
        return 'blue'
      } else {
        // Look for something named the same, and make this node the same color if found.
        var sameNamedEles
        if (node === null) {
          sameNamedEles = cy.$("[name = '" + name + "']")
        } else {
          sameNamedEles = cy.$("[name = '" + name + "']").difference(node)
        }

        if (sameNamedEles.length > 0 && name !== '') {
          return sameNamedEles.data('defaultColor')
        }
      }
    }

    // If none of the above match:
    return getRandomColor()
  }

  cytoscape('collection', 'getColor', function () { return getColor(this) })

  function setColor () {
    var color = this.getColor()
    this.data('defaultColor', color)
  }
  cytoscape('collection', 'setColor', setColor)

  function rename (ele, newName = null) {
    if (newName === null) {
      newName = utils.getText()
    }
    if (!(newName === null)) {
      ele.data('name', newName)
      ele.setColor()
    }
  }
  cytoscape('collection', 'rename', function (name = null) { rename(this, name) })

  function setParent (newParent) {
    // Set self's parent to newParent.
    if (newParent != null && newParent.id()) {
      ur.do('changeParent', {
        'parentData': newParent.id(),
        'nodes': this,
        'posDiffX': 0,
        'posDiffY': 0})
    } else {
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


  var dclickPrevTap
  var dclickTappedTimeout
  var eSelected

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
      } else if (tapTarget === cy && keysPressed.has('w')) {
        // Click on the background with 'e'
        n = newNode(event.position)
        dclickTappedTimeout = false
        if (eSelected.length === 1) {
          newEdge(n, eSelected)
          n = n.setParent(eSelected.parent())
        }
        selectOnly(eSelected)
      } else if (dclickTappedTimeout && dclickPrevTap) {
        clearTimeout(dclickTappedTimeout)
      }
      // If double clicked:
      if (dclickPrevTap === tapTarget && dclickTappedTimeout) {
        n = newNode(event.position)
        selectOnly(n)
        dclickPrevTap = null
      }
    } else {
      if (tapTarget.isNode() && dclickTappedTimeout && dclickPrevTap) {
        clearTimeout(dclickTappedTimeout)
      }
      // If double clicked:
      if (dclickPrevTap === tapTarget && dclickTappedTimeout) {
        rename(tapTarget)
      }
    }
    // Update doubleclick handlers
    dclickTappedTimeout = setTimeout(function () { dclickPrevTap = null }, 300)
    dclickPrevTap = tapTarget
  })

  // Hold 'e/w' and tap a node to make a new edge
  cy.on('tap', 'node', function (event) {
    var target = event.target
    var sources = cy.$('node:selected').difference(event.target)
    if (sources.length > 0) {
      if (keysPressed.has('e')) {
        newEdge(sources, target)
        selectOnly(target)
        sources.connectedClosure().setParent(target.parent())
      } else if (keysPressed.has('w')) {
        sources.map(source => newEdge(target, source))

        sources = sources.connectedClosure().setParent(target.parent())
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
    if (selected.parents().length === 1) {
      selected.setParent(null)
    } else {
      var parent = newNode()
      parent.setType('Lambda')
      var closure = selected.connectedClosure()
      closure.setParent(parent)
      selectOnly(parent)
    }
  },
  'keypress')

    // p to 'parens': wrap selection in a hypernode representing 'evaluate all this together',
    // corresponding to wrapping () around a group.
  Mousetrap.bind('p', function () {
    // If all of them belong to the same parent, take them out of the parent.
    var selected = cy.$('node:selected')
    if (selected.parents().length === 1) {
      selected.setParent(null)
    } else {
      var parent = newNode()
      parent.setType('Parens')
      var closure = selected.connectedClosure()
      closure.setParent(parent)
      selectOnly(parent)
    }
  },
    'keypress')

  // d to 'define': wrap selection in a hypernode, containing the selection
  // and its closed neighbourhood, corresponding to a define statement.
  Mousetrap.bind('d', function () {
    // If all of them belong to the same parent, take them out of the parent.
    var selected = cy.$('node:selected')
    if (selected.parents().length === 1) {
      selected.setParent(null)
    } else {
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
  Mousetrap.bind('backspace', function () { ur.do('deleteEles', cy.$(':selected')) })

  Mousetrap.bind('V', function () { cy.$(':selected').toggleVariable() })
  Mousetrap.bind('P', function () { toLisp(cy.$(':selected')) })
  Mousetrap.bind('Z', function () { ur.undo() })

  // Recognise keys pressed down
  var keysPressed = new Set()
  Mousetrap.bind('e', function () {
    keysPressed.add('e')
    eSelected = cy.$('node:selected')
  },
    'keypress'
  )
  Mousetrap.bind('e', function () { keysPressed.delete('e') }, 'keyup')

  Mousetrap.bind('w', function () {
    keysPressed.add('w')
    eSelected = cy.$('node:selected')
  },
    'keypress'
  )
  Mousetrap.bind('w', function () { keysPressed.delete('w')}, 'keyup')

  Mousetrap.bind('c', function () {
    if (!keysPressed.has('c')) {
      keysPressed.add('c')
      commentPoints.enableDrawingMode()
    }
  },
    'keydown'
  )
  Mousetrap.bind('c', function () {
    keysPressed.delete('c')
    commentPoints.disableDrawingMode()
  },
    'keyup'
  )

  Mousetrap.bind('r',
    function () {
      keysPressed.add('r')
      var selected = cy.$(':selected')
      if (selected.length === 1) {
        selected.rename()
        keysPressed.delete('r')
      }
    },
    'keypress')
  Mousetrap.bind('r', function () { keysPressed.delete('r') }, 'keyup')

  function loadState (objectId) {
    var x = document.getElementById(objectId).files[0]
    var reader = new FileReader()
    reader.onload = function (e) {
      var graphString = e.target.result

      // We HAVE to double-load elements here: once to get them into the
      // graph, and once to set their parents correctly. If we don't, when
      // elements are loaded and don't have a parent in place already,
      // not only do they set the parent to 'undefined', they also
      // _edit the fucking json_ so that the parent is thereafter undefined.
      //
      // That means that if you try to use the same JSON object twice for the
      // two loads, it WON'T WORK because it's been modified by the first.
      // WHAT THE HELL, CYTOSCAPE??? (Yes I lost several hours to this bug.)
      cy.json()
      cy.json(JSON.parse(graphString))
      JSON.parse(graphString).elements.nodes.map(function (jsn) {
        var nodeId = jsn.data.id
        var nodeParent = jsn.data.parent
        cy.$id(nodeId).setParent(cy.$id(nodeParent))
      })
      commentPoints.reset()
      commentPoints.load(JSON.parse(graphString).comments)
    }
    reader.readAsText(x, 'UTF-8')
  }

  function saveState () {
    var fileName = window.prompt('File name:', '')
    var comments = commentPoints.serialize()
    if (!(fileName === null)) {
      var jsonData = JSON.stringify({
        'elements': cy.json()['elements'],
        'comments': comments})
      var a = document.createElement('a')
      var file = new Blob([jsonData], {type: 'text/plain'})
      a.href = URL.createObjectURL(file)
      a.download = fileName + '.txt'
      a.click()
    }
  }

  function resetGraph () {
    if (confirm('REALLY CLEAR ALL? (There\'s no autosave and no undo!)')) {
      console.log('RESET')
      cy.remove(cy.$(''))
      commentPoints.reset()
      cy.forceRender()
    }
  }

  function selectOnly (ele) {
    cy.$().deselect()
    ele.select()
  }

  function connectedClosure () {
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
