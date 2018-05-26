import 'yuki-createjs'
import * as utils from './utils'

var cy
var stage
var currentShape
var thisThing
var oldX, oldY
var haveAddedText = false
var PENCOLOUR = createjs.Graphics.getRGB(100, 100, 100)
var PENSIZE = 20
var TEXTFONT = '60px Helvetica'

function CommentsCanvas (cyObj) {
  /* ******************\
  || CANVAS BULLSHIT ||
  ********************/
  thisThing = this
  cy = cyObj
  var layer = cy.cyCanvas({
    zIndex: 100,
    pixelRatio: 'auto'
  })
  var canvas = layer.getCanvas()
  canvas.setAttribute('id', 'commentsCanvas')

  stage = new createjs.Stage(canvas)

  cy.on('render cyCanvas.resize', function (evt) {
    var pan = cy.pan()
    var zoom = cy.zoom()

    stage.x = 2 * pan.x
    stage.y = 2 * pan.y
    stage.scaleX = zoom
    stage.scaleY = zoom
    stage.update()
  })

  this.serialize = function () {
    /*console.log(JSON.stringify(stage.children.map(function (shape) {
      return toBase64(shape)
    })))*/
    console.log(stage.children)
    console.log(stage.children.map(serialize))
    return stage.children.map(serialize)
  }

  this.reset = function () {
    stage.removeAllChildren();
    stage.update();
  }

  this.enableDrawingMode = function () {
    this.drawingMode = true
    cy.userPanningEnabled(false)
    cy.boxSelectionEnabled(false)
    cy.on('mousedown', this.startDrawing)
    cy.on('mouseup', this.stopDrawing)
    cy.on('tap', addText)
    haveAddedText = false
  }

  this.disableDrawingMode = function () {
    this.drawingMode = false
    cy.userPanningEnabled(true)
    cy.boxSelectionEnabled(true)
    cy.off('mousedown', this.startDrawing)
    cy.off('mouseup', this.stopDrawing)
    cy.off('tap', addText)
    haveAddedText = false
  }

  this.startDrawing = function (evt) {
    currentShape = new createjs.Shape()
    var g = currentShape.graphics
    addPointListeners(currentShape)
    g.beginStroke(PENCOLOUR)
    stage.addChild(currentShape)
    cy.on('mousemove', addPoint, false)
  }

  this.stopDrawing = function () {
    cy.off('mousemove', addPoint, false)
  }

  this.load = function (json) {
    if (json) {
      var pos = function (ele) { return {position: {x: ele.x / 2, y: ele.y / 2}} }
      json.forEach(function(element) {
        if (element.type === "Text") {
          addText(pos(element), element.text)
        } else {
          thisThing.startDrawing()
          element.points.forEach(function (ele) {
            addPoint(pos(ele))})
          thisThing.stopDrawing()
        }
      })
    }
  }
}

var addText = function (evt, inpText = null) {
  if (inpText === null) {
    inpText = utils.getText()
  }
  if (inpText !== null) {
    haveAddedText = true
    var text = new createjs.Text(inpText, TEXTFONT, 'black')
    text.x = 2 * evt.position.x
    text.y = 2 * evt.position.y
    addTextListeners(text)
    stage.addChild(text)
    stage.update()
  }
}

var addPoint = function (evt) {
  if (!haveAddedText) {
    var x = 2 * evt.position.x
    var y = 2 * evt.position.y
    currentShape.graphics.lineTo(x, y)
    .setStrokeStyle(PENSIZE, "round", "round")
    .moveTo(x, y)
    stage.update()
  }
}

var addPointListeners = function (obj) {
  var move = function (evt) {
    obj.x = 2 * evt.position.x
    obj.y = 2 * evt.position.y
    stage.update()
  }
  var commentDelete = function (evt) {
    if (evt.keyCode === 8 /* backspace */) {
      stage.removeChild(obj)
    }
  }
  obj.on('mousedown', function (evt) {
    currentShape = obj
    cy.userPanningEnabled(false)
    cy.boxSelectionEnabled(false)
    cy.on('mousemove', move)
    document.addEventListener('keydown', commentDelete)
  })
  obj.on('pressup', function (evt) {
    cy.userPanningEnabled(true)
    cy.boxSelectionEnabled(true)
    cy.off('mousemove', move)
    document.removeEventListener('keydown', commentDelete)
  })
}

var addTextListeners = function (obj) {
  var move = function (evt) {
    obj.x = 2 * evt.position.x
    obj.y = 2 * evt.position.y
    stage.update()
  }
  var commentDelete = function (evt) {
    if (evt.keyCode === 8 /* backspace */) {
      stage.removeChild(obj)
    }
  }
  obj.on('mousedown', function (evt) {
    currentShape = obj
    cy.userPanningEnabled(false)
    cy.boxSelectionEnabled(false)
    cy.on('mousemove', move)
    document.addEventListener('keydown', commentDelete)
  })
  obj.on('pressup', function (evt) {
    cy.userPanningEnabled(true)
    cy.boxSelectionEnabled(true)
    cy.off('mousemove', move)
    document.removeEventListener('keydown', commentDelete)
  })
}

var serialize = function (comObj) {
  console.log(comObj.constructor.name)
  if (comObj.constructor.name === "Text") {
    return {
      type: "Text",
      text: comObj.text,
      x: comObj.x,
      y: comObj.y
    }
  } else {
    return {
      type: "Line",
      points: comObj.graphics._instructions.slice(1, -1)
      // (slice cuts off the 'beginpath' and format instructions,
      // redundant atm)
    }
  }
}

module.exports = {CommentsCanvas}
