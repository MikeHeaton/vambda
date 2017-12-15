import buildEditor from './editor'
import parseContext from './parse'

var c = buildEditor()

window.loadState = c['loadState']
window.saveState = c['saveState']
window.resetGraph = c['resetGraph']
window.parseButton = function () {
  var cy = c['cy']
  return parseContext(cy.$('node:orphan'))
}
