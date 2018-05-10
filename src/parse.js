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
  // Gets name if there is one, else refer to the node by its id.
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
  var subNodes = node.children()

  if (selfType === 'Parens') {
    return '((lambda ()' + evaluateContext(subNodes, boundVariables) + '))'
  }
  if (selfType === 'Lambda') {
    // Find variables of the lambda function.
    var nearBoundVariables = subNodes
      .filter("node[type = 'NearBoundVariable']")
      .map(n => getRef(n))
    var extraBoundVariables = node.data('name').split(' ')
    var boundVariables =
      nearBoundVariables
      .concat(extraBoundVariables)
      .sort()
    var stringedBoundVariables = '(' +
      boundVariables
      .filter(
        function (el, i, arr) {
          return arr.indexOf(el) === i
        })
      .join(' ')
      + ')'

    return '(lambda' + stringedBoundVariables + ' ' + evaluateContext(subNodes, boundVariables) + ')'
  } else if (selfType === 'Define') {
    //return '(define ' + getRef(node) + ' (delay ((lambda ()' + evaluateContext(subNodes, boundVariables) + '))))'
    return '(define ' + getRef(node) + ' ((lambda () ' + evaluateContext(subNodes, boundVariables) + ' )))'
  } else {
    // Else we have a variable to evaluate, with force-delay to make the evaluation lazy.
    // 'if' can't be force-delayed, so we need a special rule for this evaluation.
    // (TODO: this is an ugly fix!)
    /*var nodeName = getRef(node)
    if (nodeName === 'if') {
      return nodeName
    } else {
      return '(force (delay ' + getRef(node) + '))'
    }*/
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
  // A context is a list of nodes to be evaluated in an order.
  var unsorted_defs = context.filter(n => (typ(n) === 'Define')).toArray()
  console.log("UNSORTED:", unsorted_defs.map(function(f) {return f.data('name')}))
  var definitionNodes = sort_porder(unsorted_defs, definition_order)

  console.log("SORTED:", definitionNodes.map(function(f) {return f.data('name')}))
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

  var allPhrases = definitions.concat(executions)

  if (allPhrases.length > 1) {
    return allPhrases.join('\n')
  }
  else {
    return allPhrases.join('\n')
  }

}

function typ (node) {
  return node.data('type')
}

function definition_order (nodeA, nodeB) {
  /*
   * If A and B are two definition nodes in a context
   * and A is contained in B then B needs to precede A in execution.
   */
   //console.log((nodeA.descendants().union(nodeA)))
   var nodeA_descendants = (nodeA.descendants().union(nodeA)).map(
     function(x, i, eles) {return x.data('name')}
   )
   //console.log(nodeA, nodeA_descendants)
   var nodeB_descendants = (nodeB.descendants().union(nodeB)).map(
     function(x, i, eles) {return x.data('name')}
   )

   if (nodeB.data('name') in nodeA_descendants) {
     return 1
   } else {
     return 0
   }
}

function sort_porder(array, order_fn) {
  //var array = raw_array.copy()
  for (var i=0; i<array.length - 1; i++) {
    for (var j=i+1; j<array.length; j++) {
      if (order_fn(array[i], array[j]) > 0) {
        var temp = array[i]
        array[i] = array[j]
        array[j] = temp
      }
    }
  }
  return array
}

module.exports = compileCanvas
