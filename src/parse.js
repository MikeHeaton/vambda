import BiwaScheme from 'BiwaScheme'

function compileCanvas (graph) {
  var compiledLisp = evaluateContext(graph, [])
  displayResult(compiledLisp)
}

function displayResult (compiledLisp) {
  function writeToDisplay (lispOutput) {
    var newHtml = '>> ' + lispOutput + '<br />' + compiledLisp
    document.getElementById('lispOutput').innerHTML = newHtml
  }
  var biwa = new BiwaScheme.Interpreter(writeToDisplay)
  biwa.evaluate(compiledLisp, writeToDisplay)
}

function getRef (ele) {
  // Gets name if there is one else refer to the node by its id.
  if (ele.data('name') !== '') {
    return ele.data('name')
  } else if (ele.isEdge()) {
    return getRef(ele.source())
  } else {
    return ele.id()
  }
}

function nodeEval (node) {
  var selfType = typ(node)

  if (selfType === 'Lambda') {
    // Find variables of the lambda function.
    var subNodes = node.children()
    var nearBoundVariables = subNodes
      .filter("node[type = 'NearBoundVariable']")
      .map(n => getRef(n))
    var extraBoundVariables = node.data('name').split(' ')
    var boundVariables =
      nearBoundVariables
      .concat(extraBoundVariables)
      .sort()
    var stringedBoundVariables =
      boundVariables
      .filter(
        function (el, i, arr) {
          return arr.indexOf(el) === i
        })
      .join(' ')

    return '(lambda (' + stringedBoundVariables + ') ' + evaluateContext(subNodes) + ')'
  } else if (selfType === 'Define') {
    return '(define ' + getRef(node) + ' ' + evaluateContext(node.children(), boundVariables) + ')'
  } else {
    // Else the evaluation is just the name.
    return getRef(node)
  }
}

function evaluateNode (node, contextualBoundVariables = []) {
  var compiledNode = nodeEval(node)

  if (node.incomers('edge').length > 0) {
    // It's some kind of execution.
    // Evaluate the incomers recursively.
    var edgeRefs = node.incomers('edge').sort(function (a, b) {
      return getRef(a).localeCompare(getRef(b))
    })
    .map(edge => evaluateNode(edge.source()))
    var stringedEdges = edgeRefs.join(' ')

    return '(' + compiledNode + ' ' + stringedEdges + ')'
  } else {
    return compiledNode
  }
}

function evaluateContext (context, boundVariables = []) {
  var definitionNodes = context.filter(
    n => (typ(n) === 'Define'))
  // Hopefully there's exactly one execution node (?)
  var executionNodes = context.filter(
    n => (typ(n) !== 'Define' &&
    context.leaves().contains(n)))

  // Evaluate definitions first, then the execution.
  var definitions = definitionNodes.map(function (ele, i, eles) {
    return evaluateNode(ele, boundVariables)
  })
  var executions = executionNodes.map(function (ele, i, eles) {
    return evaluateNode(ele, boundVariables)
  })

  return definitions.concat(executions).join('\n')
}

function typ (node) {
  return node.data('type')
}

module.exports = compileCanvas
