import BiwaScheme from 'biwascheme'

/*
 * This file controls how a vambda program is compiled into Lisp and executed.
 * The entry point is the compileCanvas function. It accepts the entry
 * nodes to the program, compiles the program, and executes the compiled program.
 *
 * In overview: this is done recursively. The function evaluateNode compiles
 * a node with its parents. When the node is not a singleton (ie is a define
 * or a lambda), evaluateContext compiles the content of the node recursively.
 */

class Node {
  /*
   * A node is either a basic node, a lambda bubble or a define bubble.
   * This class contains some basic utility functions.
   */
  constructor (cytoscapeObj) {
    this._cytoscapeObj = cytoscapeObj
  }

  static type (ele) {
    return ele.data('type')
  }

  get name () {
    // Gets name of the element if there is one,
    // else refer to the node by its id.
    if (this._cytoscapeObj.data('name') !== '') {
      return this._cytoscapeObj.data('name')
    } else {
      return this._cytoscapeObj.id()
    }
  }
}

class DefineNode extends Node {
  evaluate (boundVariables = new Set()) {
    var contents = this._cytoscapeObj.children()
    var context = new Context(contents, this.boundVariables)
    return context.evaluate()
  }

  get nestedNodeNames () {
    /*
     * Returns the names of every node inside this context;
     * used to determine order of definitions.
     */

    // TODO NOTE I think this won't work, because sort assumes a total order
    // whereas we only have a preorder >.<
    return new Set(this._cytoscapeObj.children().map(
        function (ele, i, eles) {
          return [...createNodeObject(ele).nestedNodeNames()]
        }.flatten()
      )
    )
  }

  compare (other) {
    /*
     * Compare the contents of this define to the content of another define.
     * If one defines a bound variable which is contained in the other,
     * they should be ordered so that the defining one comes first.
     */
    if (this.nestedNodeNames.contains(other.name)) {
      return -1
    } else if (other.nestedNodeNames.contains(this.name)) {
      return 1
    } else {
      return 0
    }
  }
}

class LambdaNode extends Node {
  get nestedNodeNames () {
    /*
     * Returns the names of every node inside this context;
     * used to determine order of definitions.
     */
    return new Set(this._cytoscapeObj.children().map(
        function (ele, i, eles) {
          return [...createNodeObject(ele).nestedNodeNames]
        }.flatten()
      )
    )
  }
}

class BasicNode extends Node {
  get nestedNodeNames () {
    /*
     * Returns the name of this node in a set;
     * used to determine order of definitions.
     */
    return new Set(this.name)
  }
}

function createNodeObject (ele) {
  if (Node.type(ele) === 'Define') {
    return new DefineNode(ele)
  } else if (Node.type(ele) === 'Lambda') {
    return new LambdaNode(ele)
  } else {
    return new BasicNode(ele)
  }
}

class Execution {
  /*
   * An execution object is a part of a context. It is a tree of one or more nodes,
   * which can be basic nodes or lambda bubbles (but not define bubbles).
   *
   * This class handles turning the execution into lisp code.
   */


}

class Context {
  /*
   * A context consists of a collection of nodes to be evaluated in some order.
   * A well-defined context has exactly one execution tree and any number of
   * definitions.
   *
   * Currently, we assume the context is well-defined. TODO: add better
   * handling for when this is not the case.
   * (An error monad would be great here. But... JavaScript...)
   */
  constructor (cytoscapeNodes) {
    this._cytoscapeNodes = cytoscapeNodes
    this.definitionNodes = this.getDefinitions()
    this.executionNodes = this.getExecutions()

    if (this.executionNodes.length !== 1) {
      // Throw a shit-fit
      alert(`Error, context with ${this.executionNodes.length} execution nodes found.` +
      '\nContexts must have exactly one execution node.')
    }
  }

  getDefinitions () {
    // Get all of the definition nodes, ordered by definition order.
    return this._cytoscapeNodes.filter(
      n => (typ(n) === 'Define')
    )
    .map(function (ele, i, eles) {
      return new DefineNode(ele)
    })
    .sort(function (a, b) { return a.compare(b) })
  }

  getExecutions () {
    return this._cytoscapeNodes.filter(
      n => (typ(n) !== 'Define' &&
      this._cytoscapeNodes.leaves().contains(n)))
  }

  evaluate (baseBoundVariables = new Set()) {
    var boundVariables = new Set(baseBoundVariables) // Shallow copy to avoid side effects.

    var defnItems = ''
    for (defn in this.definitionNodes) {
      defnItems.append(defn.evaluate(boundVariables) + '\n')
      boundVariables.add(defn.name)
    }
    var executionItems = this.executionNodes.map(
      function (n) { return n.evaluate() }.join('\n')
    )


    var compiledExecutions = this.executionNodes.map(function (ele, i, eles) {
      return evaluateNode(ele, this.boundVariables)
    })

  }




}

function compileCanvas (graph) {
  /* Accepts a cytoscape collection which is the entry nodes to the program.
   * That is, the first executed node and the top level 'define' nodes around it.
   * Compiles the program and executes it, returning both the result and
   * the compiled lisp code.
   */

  // We begin with a call to evaluate the global context.
  var compiledLisp = evaluateContext(graph, new Set())
  var result = execute(compiledLisp)
  return [result, compiledLisp]
}

function execute (compiledLisp) {
  var biwa = new BiwaScheme.Interpreter()
  return biwa.evaluate(compiledLisp)
}

function getRef (ele) {
  // Gets name of the element if there is one,
  // else refer to the node by its id.
  if (ele.data('name') !== '') {
    return ele.data('name')
  } else if (ele.isEdge()) {
    return getRef(ele.source())
  } else {
    return ele.id()
  }
}

function evaluateContext (context, boundVariables = []) {
  /*
   * A context consists of a collection of nodes to be evaluated in some order.
   * A well-defined context has exactly one execution node and any number of
   * definition nodes.
   *
   * Currently, we assume the context is well-defined. TODO: add better
   * handling for when this is not the case!
   * (An error monad would be great here. But... JavaScript...)
   */

  var definitionNodes = context.filter(
    n => (typ(n) === 'Define'))
  var executionNodes = context.filter(
    n => (typ(n) !== 'Define' &&
    context.leaves().contains(n)))

  if (executionNodes.length !== 1) {
    // Throw a shit-fit
    alert(`Error, context with ${executionNodes.length} execution nodes found.` +
    '\nContexts must have exactly one execution node.')
  }

  // Evaluate definitions first, then the execution.
  var definitions = definitionNodes.map(function (ele, i, eles) {
    return evaluateNode(ele, boundVariables)
  })
  var executions = executionNodes.map(function (ele, i, eles) {
    return evaluateNode(ele, boundVariables)
  })

  var allPhrases = definitions.concat(executions)
  console.log(allPhrases)
  if (allPhrases.length > 1) {
    return allPhrases.join('\n')
  } else {
    return allPhrases.join('\n')
  }
}

function nodeEval (node, boundVariables) {
  /*
   * Takes in a single node. Recursively compiles the node and its children
   * to a lisp statement.
   */

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
    return '(define ' + getRef(node) + ' ((lambda () ' + evaluateContext(subNodes, boundVariables) + ' )))'
  } else {
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

function typ (node) {
  return node.data('type')
}

module.exports = compileCanvas
