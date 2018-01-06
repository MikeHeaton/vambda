class CommentsCanvas {
  constructor(cy) {
    /*******************\
    || CANVAS BULLSHIT ||
    ********************/
    this.cy = cy
    var c = this

    var layer = cy.cyCanvas({
      zIndex: 100,
      pixelRatio: "auto",
    })
    this.canvas = layer.getCanvas()
    this.canvas.setAttribute("id", "commentsCanvas")
    var ctx = this.canvas.getContext("2d")

    this.clickDrag = []
    this.clickX = []
    this.clickY = []
    this.textText = []
    this.textX = []
    this.textY = [] // <-- TO IMPLEMENT

    cy.on("render cyCanvas.resize", function(evt) {
      var pan = cy.pan();
      var zoom = cy.zoom();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.translate(pan.x, pan.y);

      layer.resetTransform(ctx);
      layer.clear(ctx);
      ctx.globalAlpha=1.0
      layer.setTransform(ctx)

      // DRAW LINES
      ctx.strokeStyle = 'gray'
      ctx.lineJoin = "round"
      ctx.lineWidth = 5
    	for(var i = 0; i < c.clickX.length; i++)
    	{
        ctx.beginPath();
    		if(c.clickDrag[i] && i){
    			ctx.moveTo(c.clickX[i-1], c.clickY[i-1])
    		}else{
    			ctx.moveTo(c.clickX[i], c.clickY[i])
    		}
    		ctx.lineTo(c.clickX[i], c.clickY[i])
        ctx.stroke()
      }
      // DRAW TEXT
      ctx.font = "30px Arial"
      for(var i = 0; i < c.textText.length; i++)
    	{
        ctx.fillText(c.textText[i],c.textX[i],c.textY[i]);
      }
    })
  }

  addClick(x, y, drag) {
    this.clickX.push(x)
    this.clickY.push(y)
    this.clickDrag.push(drag)
    this.cy.emit("render")
  }

  addText(x, y, text) {
    this.textX.push(x)
    this.textY.push(y)
    this.textText.push(text)
    this.cy.emit("render")
  }

  reset () {
    this.clickX = []
    this.clickY = []
    this.clickDrag = []
  }

  load (json) {
    this.clickX = json.clickX
    this.clickY = json.clickY
    this.clickDrag = json.clickDrag
    this.textX = json.textX
    this.textY = json.textY
    this.textText = json.textText
  }


}

module.exports = {CommentsCanvas}
