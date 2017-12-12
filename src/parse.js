import BiwaScheme from 'BiwaScheme';

function parseContext(graph) {
  var compiledLisp = evaluateContext(graph);
  displayResult(compiledLisp);
}

function parse(node) {
  var compiledLisp = evaluateNode(node);
  displayResult(compiledLisp);
}

function displayResult(compiledLisp) {
  function writeToDisplay(lispOutput) {
    var newHtml = compiledLisp + " :<br />" + "\>\> " + lispOutput;
    document.getElementById("lispOutput").innerHTML = newHtml;
  }
  var biwa = new BiwaScheme.Interpreter(writeToDisplay);
  biwa.evaluate(compiledLisp, writeToDisplay);
}

function getRef(ele) {
  // Gets name if there is one; else refer to the node by its id.
  var name = ele.data("name");
  return (name != "") ? name : ele.id();
}

function evaluateNode(node) {
  /* A node has two relevant properties:
  - is it a parent?
      Parents === defs and lambdas,
      nonparents are primitive.
  - is it a sink node? (leaf)
      Sink nodes are to be evaluated at this level,
      nonsinks are evaluated later in the recursion.
  */
  var selfType = typ(node);

  if (selfType == 'lambda') {
    var topLevelCompiledTerm = evaluateLambda(node)
  }
  else if (selfType == 'define') {
    var topLevelCompiledTerm = "(define " + getRef(node)+ " " + evaluateContext(node.children()) + ")";
  }
  else {
    var name = node.data("name");
    var topLevelCompiledTerm = (name != "") ? name : node.id();
  }

  var inbounds = node.incomers('edge')
  if (inbounds.length > 0) {
    var edgeRefs = inbounds.sort(function(a,b) {
        return getRef(a).localeCompare(getRef(b))})
      .map(edge => evaluateNode(edge.source()));

    var stringedEdges = edgeRefs.join(" ")
    var closedRepr = "(" + topLevelCompiledTerm + " " + stringedEdges + ")";
  }
  else {
    var closedRepr = topLevelCompiledTerm
  }
  return closedRepr
}

function evaluateLambda(node) {
  // A lambda looks like:
  /* (LAMBDA (bound-variables) (
        (define functionname (recursivecall))
        (some expression to evaluate)
      ))
  */
  var subNodes = node.children();

  // Set up variables of the function.
  var boundVariables = subNodes.filter("[?variable]").map(n => getRef(n)).sort();
  var stringedBoundVariables = boundVariables.filter(function (el, i, arr) {
                                             return arr.indexOf(el) === i;}).join(" ")

  return "(lambda (" + stringedBoundVariables + ") " + evaluateContext(subNodes) + ")";
}

function evaluateContext(context) {
  var definitionNodes = context.filter(n => (typ(n) == 'define'));
  // Hopefully there's exactly one execution node (?)
  var executionNodes = context.filter(n => (typ(n) != 'define' && context.leaves().contains(n)));

  // Evaluate definitions first, then the execution.
  var definitions = definitionNodes.map(function(ele, i, eles) {return evaluateNode(ele);});
  var executions = executionNodes.map(function(ele, i, eles) {return evaluateNode(ele);});

  return definitions.concat(executions).join("\n")
}


function typ(node) {
  if (node.isParent() && (node.data("name")) != "") {return 'define'}
  else if (node.isParent() && (node.data("name")) == "") {return 'lambda'}
  else {return 'other'}
}

module.exports = {parse, parseContext};
