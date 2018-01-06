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
    this.text = [] // <-- TO IMPLEMENT

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
    	for(var i = 0; i < c.clickX.length; i++)
    	{
        ctx.beginPath();
    		if(c.clickDrag[i] && i){
    			ctx.moveTo(c.clickX[i-1], c.clickY[i-1]);
    		}else{
    			ctx.moveTo(c.clickX[i], c.clickY[i]);
    		}
    		ctx.lineTo(c.clickX[i], c.clickY[i]);
    		ctx.closePath();

        ctx.strokeStyle = 'gray';
        ctx.lineJoin = "round";
        ctx.lineWidth = 5;
        ctx.stroke();
      }
    })
  }

  addClick(x, y, drag) {
    this.clickX.push(x)
    this.clickY.push(y)
    this.clickDrag.push(drag)
    this.cy.emit("render")
  }

  reset () {
    this.clickX = []
    this.clickY = []
    this.clickDrag = []
  }

  load (json) {
    this.clickX = json.x
    this.clickY = json.y
    this.clickDrag = json.drag
  }


}

module.exports = {CommentsCanvas}
