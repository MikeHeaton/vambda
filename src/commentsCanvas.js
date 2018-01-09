import 'yuki-createjs'

var cy
var stage
var currentShape
var oldX, oldY
var ctx

class CommentsCanvas {
  constructor (cyObj) {
    /* ******************\
    || CANVAS BULLSHIT ||
    ********************/
    cy = cyObj

    var layer = cy.cyCanvas({
      zIndex: 100,
      pixelRatio: 'auto'
    })
    this.canvas = layer.getCanvas()
    this.canvas.setAttribute('id', 'commentsCanvas')
    ctx = this.canvas.getContext('2d')

    stage = new createjs.Stage(this.canvas)

    cy.on('render cyCanvas.resize', function (evt) {
      var pan = cy.pan()
      var zoom = cy.zoom()

      stage.x = 2 * pan.x
      stage.y = 2 * pan.y
      stage.scaleX = zoom
      stage.scaleY = zoom
      stage.update();
    })
  }

  save () {
    var objects = stage.children
    console.log(JSON.stringify(stage.children.map(function (shape) {
      return toBase64(shape)
    })))



  }

  reset () {
    this.clickX = []
    this.clickY = []
    this.clickDrag = []
    this.textX = []
    this.textY = []
    this.textText = []
  }

  load (json) {
    this.clickX = json.clickX
    this.clickY = json.clickY
    this.clickDrag = json.clickDrag
    this.textX = json.textX
    this.textY = json.textY
    this.textText = json.textText
    console.log(this.clickX,
      this.clickY,
      this.clickDrag,
      this.textX,
      this.textY,
      this.textText)
  }

  enableDrawingMode () {
    this.drawingMode = true
    cy.userPanningEnabled(false)
    cy.boxSelectionEnabled(false)
    cy.on('mousedown', this.startDrawing)
    cy.on('mouseup', this.stopDrawing)
    cy.on('tap', addText)
  }

  disableDrawingMode () {
    this.drawingMode = false
    cy.userPanningEnabled(true)
    cy.boxSelectionEnabled(true)
    cy.off('mousedown', this.startDrawing)
    cy.off('mouseup', this.stopDrawing)
    cy.off('tap', addText)
  }

  startDrawing (evt) {
    var s = new createjs.Shape()
    var g = s.graphics
    addPointListeners(s)
    g.setStrokeStyle(50, 'round', 'round')
    g.beginStroke(createjs.Graphics.getRGB(0,0,0))
    stage.addChild(s)
    currentShape = s
    cy.on('mousemove', addPoint, false)
  }

  stopDrawing () {
    cy.off('mousemove', addPoint, false)
  }
}

var addText = function (evt) {
  var text = new createjs.Text('Hello World', '20px Arial', 'black');
  text.x = 2 * evt.position.x
  text.y = 2 * evt.position.y
  addTextListeners(text)
  stage.addChild(text)
  stage.update()
}

var addPoint = function (evt) {
  var x = 2 * evt.position.x
  var y = 2 * evt.position.y
  currentShape.graphics.lineTo(x, y)
  stage.update()
}

var addPointListeners = function (obj) {
  var move = function (evt) {
    obj.x = 2 * evt.position.x - oldX
    obj.y = 2 * evt.position.y - oldY
    stage.update()
  }
  var commentDelete = function (evt) {
    if (evt.keyCode === 8 /* backspace */) {
      stage.removeChild(obj)
    }
  }
  obj.on('mousedown', function (evt) {
    currentShape = obj
    oldX = evt.stageX
    oldY = evt.stageY
    cy.userPanningEnabled(false)
    cy.boxSelectionEnabled(false)
    cy.on('mousemove', move)
    document.addEventListener('keydown', commentDelete)
  })
  obj.on('pressup', function (evt) {
    console.log(obj)
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

var toBase64 = function (myLine) {
  var b64 = function (string) {
    var BASE_64_LIST = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '/']
    return BASE_64_LIST[parseInt(string, 2)]
  }

  console.log()
  // 001 = 'lineTo', 1 = '16bit locations', 00 = spare bits.
  var header = b64('001' + '1' + '00')
  var xy = b74(myLine.x)




  // Header = 001100
  /*var prevX = 0
  var prevY = 0

  for (var i = 2; i < myShape.graphics._instructions.length - 1; i++) {
    var header
    var x = 0x00000
    var y = 0x00000
    if (myShape.graphics._instructions[i].f === ctx.lineTo || myShape.graphics._instructions[i].f === ctx.moveTo) {
      if (myShape.graphics._instructions[i].f === ctx.lineTo) {
        header = 'M'
        var xStart = myShape.graphics._instructions[i].params[0] * 10 - prevX
        var yStart = myShape.graphics._instructions[i].params[1] * 10 - prevY
        x = Math.abs(xStart)
        y = Math.abs(yStart)
        prevX += xStart
        prevY += yStart
        var x1 = (x & 0xff000)
        if (xStart < 0) x1 |= 0x20
        var x2 = (x & 0x00fc0) >> 6
        var x3 = (x & 0x0003f)
        var y1 = (y & 0xff000) >> 12
        if (yStart < 0) y1 |= 0x20
        var y2 = (y & 0x00fc0) >> 6
        var y3 = (y & 0x0003f)
        x = BASE_64_LIST[x1] + BASE_64_LIST[x2] + BASE_64_LIST[x3]
        y = BASE_64_LIST[y1] + BASE_64_LIST[y2] + BASE_64_LIST[y3]
      } else if (myShape.graphics._instructions[i].f === ctx.moveTo) {
        header = 'E'
        x |= myShape.graphics._instructions[i].params[0] * 10
        y |= myShape.graphics._instructions[i].params[1] * 10
        prevX = x
        prevY = y
        x1 = (x & 0xff000) >> 12
        if (x < 0) x1 |= 0x20
        x2 = (x & 0x00fc0) >> 6
        x3 = (x & 0x0003f)
        y1 = (y & 0xff000) >> 12
        if (y < 0) y1 |= 0x20
        y2 = (y & 0x00fc0) >> 6
        y3 = (y & 0x0003f)
        x = BASE_64_LIST[x1] + BASE_64_LIST[x2] + BASE_64_LIST[x3]
        y = BASE_64_LIST[y1] + BASE_64_LIST[y2] + BASE_64_LIST[y3]
      }
    }
    result += header + x + y
  }
  return result*/
}

module.exports = {CommentsCanvas}
