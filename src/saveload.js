import cytoscape from 'cytoscape';
var cy = self._private.cy;

function loadState(objectId) {
  var x = document.getElementById(objectId).files[0];
  var reader = new FileReader();
  reader.onload = function(e) {
    var graphString = e.target.result;
    var graphJson = JSON.parse(graphString);
    console.log(graphJson)
    cy.json(graphJson);
  }
  reader.readAsText(x, "UTF-8");
}

function saveState() {
  var fileName = window.prompt("File name:", "")
  if (!(fileName === null)) {
    var jsonData = JSON.stringify(
      {'elements': cy.json()['elements']}
    )
    console.log("keys:", jsonData.keys)
    var a = document.createElement("a");
    var file = new Blob([jsonData], {type: 'text/plain'});
    a.href = URL.createObjectURL(file);
    //a.download = fileName + '.vda';
    a.click();
  }
}

function resetGraph() {
  if (confirm("REALLY CLEAR ALL? (There's no autosave and no undo!)")) {
    console.log("RESET")
    cy.remove(cy.$(""));
  }
}

module.exports = {loadState, saveState, resetGraph};
