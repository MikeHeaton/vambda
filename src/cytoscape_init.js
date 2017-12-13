import cytoscape from 'cytoscape';
import 'biwascheme';

function create_canvas() {
  //cytoscape.use( require('undo-redo') );
  return cytoscape({
    container: document.getElementById('cy'),
    boxSelectionEnabled: true,
    style: [
    {
    selector: 'node',
    style: {
      'content': 'data(name)',
      'text-valign': 'center',
      'text-outline-width': 2,
      'text-outline-color': 'blue',
      'color': 'white',
      'border-color': 'blue',
      'border-width': 0,
      'background-color': 'data(defaultColor)'
      }
    },{
    selector: '$node > node',
    style: {
      'background-color': 'white',
      'text-valign': 'top',
      'text-halign': 'center',
      'border-width': 5,
      'shape': 'roundrectangle',
      'border-color': 'gray',
      'padding': '5px',
      'font-size': '20px',
      }
    },{
    selector: '$node[name ^= "("][name $= ")"] > node',
    style: {
      'background-color': 'white',
      'text-valign': 'top',
      'text-halign': 'center',
      'border-width': 5,
      'shape': 'roundrectangle',
      'border-color': 'gray',
      'padding': '15px',
      'font-size': '12px',
      'text-margin-y': '18px',
      'text-margin-x': '-20px',
      'text-outline-width': 0,
      'text-outline-color': 'blue',
      'color': 'black'
      }
    },{
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
      'text-outline-color': 'black',
      }
    },{
    selector: 'edge:selected',
    style: {
      'line-color': 'red',
      'target-arrow-color': 'red',
      'text-outline-color': 'red',
      }
    },{
    selector: 'node:selected',
    style: {
      //'text-outline-color': 'red',
      //  'background-color': 'red',
      'border-color': 'red',
      'border-width': 5,
      }
    },{
    selector: "node[?variable]",
    style: {
      'shape': 'diamond',
      'border-width': 5,
      'border-color': 'cyan',
      'background-color': 'cyan'
      }
    },{
      selector: "node:selected[?variable]",
      style: {
        'shape': 'diamond',
        'border-width': 5,
        'background-color': 'cyan',
        'border-color': 'red'
      }
    }
  ]
  });
};

module.exports = create_canvas;
