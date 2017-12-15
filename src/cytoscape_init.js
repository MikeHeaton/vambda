import cytoscape from 'cytoscape'
import 'biwascheme'

function createCanvas () {
  // cytoscape.use( require('undo-redo') );
  return cytoscape({
    container: document.getElementById('cy'),
    boxSelectionEnabled: true,
    style: [
      {
        selector: 'node',
        style: {
          'background-color': 'data(defaultColor)',
          'border-width': 0,
          'content': 'UNKNOWN TYPE', // text

          'text-outline-width': 2,
          'text-outline-color': 'black',
          'color': 'white', // font color
          'text-valign': 'center'
        }
      }, {
        selector: 'node[type = "NearBoundVariable"]',
        style: {
          'shape': 'diamond',
          'border-width': 1,
          'border-color': 'black',
          'background-color': 'cyan',
          'content': 'data(name)' // text
        }
      }, {
        selector: 'node[type = "FarBoundVariable"]',
        style: {
          'shape': 'square',
          'border-width': 1,
          'border-color': 'black',
          'background-color': 'cyan',
          'content': 'data(name)' // text
        }
      }, {
        selector: 'node[type = "Free"]',
        style: {
          'content': 'data(name)' // text
        }
      }, {
        selector: 'node[type = "Lambda"]',
        style: {
          // Compound node, by definition.
          'background-color': 'white',
          'text-valign': 'bottom',
          'text-halign': 'center',
          'border-width': 5,
          'shape': 'roundrectangle',
          'border-color': 'gray',
          'padding': '10px',
          'font-size': '15px',
          'text-margin-y': '-10px',
          'text-background-color': 'gray',
          'text-background-opacity': 1,
          'text-background-shape': 'roundrectangle',
          'text-background-padding': '3px',
          'content': 'data(name)'
        }
      }, {
        selector: 'node[type = "Define"]',
        style: {
          // Compound node, by definition.
          'background-color': 'white',
          'text-valign': 'top',
          'text-halign': 'center',
          'border-width': 5,
          'border-style': 'dashed',
          'shape': 'roundrectangle',
          'border-color': 'data(defaultColor)',
          'padding': '4px',
          'text-margin-y': '3px',
          'font-size': '20px',
          'text-background-color': 'data(defaultColor)',
          'text-background-opacity': 1,
          'text-background-shape': 'roundrectangle',
          'text-background-padding': '1px',
          'content': 'data(name)'
        }
      }, {
        selector: 'edge',
        style: {
          'curve-style': 'bezier',
          'width': 4,
          'target-arrow-shape': 'triangle',
          'line-color': 'black',
          'target-arrow-color': 'black',
          'target-label': 'data(name)',
          'target-text-offset': 20,
          'color': 'white',
          'text-outline-width': 2,
          'text-outline-color': 'black'
        }
      }, {
        selector: 'edge:selected',
        style: {
          'line-color': 'red',
          'target-arrow-color': 'red',
          'text-outline-color': 'red'
        }
      }, {
        selector: 'node:selected',
        style: {
          'border-color': 'red',
          'border-width': 5,
          'text-background-color': 'red'
        }
      }
    ]
  })
}

module.exports = createCanvas
