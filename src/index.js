import buildEditor from './editor'
import compileCanvas from './parse'

function displayResult (result, compiledLisp) {
  var newHtml = '>> ' + result + '<br />' + compiledLisp
  document.getElementById('lispOutput').innerHTML = newHtml
}

var c = buildEditor()

window.loadState = c['loadState']
window.saveState = c['saveState']
window.resetGraph = c['resetGraph']
window.parseButton = function () {
  var cy = c['cy']
  var results = compileCanvas(cy.$('node:orphan'))
  displayResult.apply(this, results)
}
