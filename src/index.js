import buildEditor from './editor'
import compileCanvas from './parse'

var c = buildEditor()

window.loadState = c['loadState']
window.saveState = c['saveState']
window.resetGraph = c['resetGraph']
window.parseButton = function () {
  var cy = c['cy']
  return compileCanvas(cy.$('node:orphan'))
}
