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
      var id = this._cytoscapeObj.data('name')
    } else {
      var id = this._cytoscapeObj.id()
    }
    return id
  }

  evaluate (boundVariables = new Set()) {
    console.log("NOT IMPLEMENTED")
  }

  nodeNames () {
    console.log("NOT DEFINED")
  }
}

class DefineNode extends Node {
  constructor(cytoscapeObj) {
    super(cytoscapeObj)
    var contents = this._cytoscapeObj.children()
    this.innerContext = new Context(contents)
  }

  evaluate (boundVariables = new Set()) {
    // Evaluates the context contained inside the define, to determine
    // what the name gets set to inside a Context.
    return this.innerContext.evaluate(boundVariables)
  }

  nodeNames () {
    return this.innerContext.nodeNames()
  }

  compare (other) {
    /*
     * Compare the contents of this define to the content of another define.
     * If one defines a bound variable which is contained in the other,
     * they should be ordered so that the defining one comes first.
     */
     console.log("this", this.nodeNames(), this.name)
     console.log("other", other.nodeNames(), other.name)
    if (this.nodeNames().has(other.name)) {
      console.log("this has other")
      return 1
    } else if (other.nodeNames().has(this.name)) {
      console.log("other has this")
      return -1
    } else {
      console.log("neither have each other")
      return 0
    }
  }
}

class ExecutionNode extends Node {
  constructor (cytoscapeObj) {
    super(cytoscapeObj)
    this.incomingEdges = this._cytoscapeObj.incomers('edge')
      .sort(function (a, b) {
        return getRef(a).localeCompare(getRef(b))
      })

    this.parents = this.incomingEdges
      .map(edge => createNodeObject(edge.source()))
  }

  evaluate (contextualBoundVariables = new Set()) {
    if (this.parents.length > 0) {
      // It's some kind of execution.
      // Evaluate the incomers recursively.
      var stringedEdges = this.incomingEdges.map( edge => edge.name).join(' ')

      return '(' + this.evaluateContent(contextualBoundVariables) + ' ' + this.parents.map(node =>
          node.evaluate()
        )
        .join(' ') + ')'
    } else {
      return this.evaluateContent(contextualBoundVariables)
    }
  }

  evaluateContent (contextualBoundVariables = new Set()) {
    console.log("evaluateContent TO BE DEFINED")
  }

  nodeNames () {
    var linkedNames = flatten(
      this.parents.map(n => Array.from(n.nodeNames()))
      )
    var nestedNames = Array.from(this.nestedNodeNames())
    var names = new Set(linkedNames.concat(nestedNames))
    //console.log("nodenames:", linkedNames, nestedNames, names)
    return names
  }

  nestedNodeNames () {
    console.log("NESTEDNODENAMES NOT DEFINED")
  }
}

class LambdaNode extends ExecutionNode {
  constructor(cytoscapeObj) {
    super(cytoscapeObj)

    var contents = this._cytoscapeObj.children()
    this.innerContext = new Context(contents)
  }

  evaluateContent (contextualBoundVariables = new Set()) {
    var boundVariables =
      this.nearBoundVariables
      .concat(this.extraBoundVariables)
      .sort()
    var stringedBoundVariables = '(' +
      boundVariables
      .filter(
        function (el, i, arr) {
          return arr.indexOf(el) === i
        })
      .join(' ')
      + ')'

    var innerResult = this.innerContext.evaluate(new Set([...contextualBoundVariables, ...stringedBoundVariables]))

    return '(lambda ' + stringedBoundVariables + ' ' + innerResult + ')'
  }

  get nearBoundVariables () {
    // TODO: this should be done using the object structure and searching
    // recursively.
    var boundVars = this._cytoscapeObj.children()
      .filter("node[type = 'NearBoundVariable']")
      .map(n => getRef(n))
    return boundVars
  }

  get extraBoundVariables () {
    return this._cytoscapeObj.data('name').split(' ')
  }

  nestedNodeNames () {
    /*
     * Returns the names of every node inside this context;
     * used to determine order of definitions.
     */
    return this.innerContext.nodeNames()
  }
}

class BasicNode extends ExecutionNode {
  constructor (cytoscapeObj) {
    super(cytoscapeObj)
    this.incomingEdges = this._cytoscapeObj.incomers('edge')
      .sort(function (a, b) {
        return getRef(a).localeCompare(getRef(b))
      })
    this.parents = this.incomingEdges
      .map(edge => createNodeObject(edge.source()))
  }

  evaluateContent (contextualBoundVariables = new Set()) {
    return this.name
  }

  nestedNodeNames () {
    /*
     * Returns the name of this node in a set;
     * used to determine order of definitions.
     */
    return new Set([this.name])
  }
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
   // TODO: the methods here should rely more on the constructed objects.
  constructor (cytoscapeNodes) {
    this._cytoscapeNodes = cytoscapeNodes
    this.definitionNodes = this.makeDefinitionNodes()
    this.executionNodes = this.makeExecutionNodes()

    if (this.executionNodes.length !== 1) {
      // Throw a shit-fit
      console.log(`Error, context with ${this.executionNodes.length} execution nodes found.` +
      '\nContexts must have exactly one execution node.')
    }

    //console.log("Context: defns, executions", this.definitionNodes, this.executionNodes)
  }

  static typ (node) {
    return node.data('type')
  }

  makeDefinitionNodes () {
    // Get all of the definition nodes, ordered by definition order.
    var unsortedNodes = this._cytoscapeNodes.filter(
      n => (Context.typ(n) === 'Define')
    )
    .map(function (ele, i, eles) {
      return new DefineNode(ele)
    })

    var sortedNodes = sort_porder(unsortedNodes)
    return sortedNodes
  }

  makeExecutionNodes () {
    return this._cytoscapeNodes.filter(
      n => (Context.typ(n) !== 'Define' &&
      this._cytoscapeNodes.leaves().contains(n)))
      .map(function (ele, i, eles) {
        return createNodeObject(ele)
      })
  }

  evaluate (baseBoundVariables = new Set()) {
    var boundVariables = new Set(baseBoundVariables) // Shallow copy to avoid side effects.

    var defnItems = ''
    for (var i=0; i < this.definitionNodes.length; i++) {
      var defn = this.definitionNodes[i]
      var itemString = "(" + defn.name + " " + defn.evaluate(boundVariables) + ")\n"
      defnItems = defnItems.concat(itemString)
      boundVariables.add(defn.name)
    }

    var executionItems = this.executionNodes.map(
      function (n) {
        return n.evaluate() }
    ).join('\n')

    var compiledExecution = this.executionNodes.map(function (node) {
      return node.evaluate(boundVariables)
    }).toString()

    if (defnItems.length > 0) {
      return "(letrec (\n" + defnItems + "\n)\n" + compiledExecution + "\n)"
    } else {
      return compiledExecution
    }
  }

  nodeNames () {
    // TODO: This is clearly ridiculous. A proper language would just union sets ffs.
    var allNodes = this.definitionNodes
      .concat(this.executionNodes)
    var allNames = allNodes.map(node => Array.from(node.nodeNames()))
    return new Set(flatten(allNames))
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

function getRef (ele) {
  // Gets name of the element if there is one,
  // else refer to the edge by its source, or node by its id.
  // TODO: eliminate this. May require instantiating edges as classes, or not.
  if (ele.data('name') !== '') {
    return ele.data('name')
  } else if (ele.isEdge())  {
    return getRef(ele.source())
  } else {
    return ele.id()
  }
}

function compileCanvas (graph) {
  /* Accepts a cytoscape collection which is the entry nodes to the program.
   * That is, the first executed node and the top level 'define' nodes around it.
   * Compiles the program and executes it, returning both the result and
   * the compiled lisp code.
   */

  // We begin with a call to evaluate the global context.
  var compiledLisp = new Context(graph).evaluate()
  //var compiledLisp = "(let* ( (SQRT (lambda (x) (let* ( (square (lambda ( a1a68690-6b60-42ac-aec7-9227e83f54b8) (* a1a68690-6b60-42ac-aec7-9227e83f54b8 a1a68690-6b60-42ac-aec7-9227e83f54b8))) (MIN 1) (good-enough? (lambda ( guess) (< (abs (- (square guess) x)) MIN))) (average (lambda ( 35b68c47-24de-4ed5-ab77-36efcf85e582 985c01aa-9a75-4e18-a885-5379fb7128e3) (/ (+ 35b68c47-24de-4ed5-ab77-36efcf85e582 985c01aa-9a75-4e18-a885-5379fb7128e3) 2.0))) (improve-guess (lambda ( guess) (average (/ x guess) guess))) (sqrt-iter (lambda ( guess) (if (good-enough? guess) guess (sqrt-iter (improve-guess guess))))) ) (sqrt-iter 8) ))) ) (SQRT 95) )"
  console.log(compiledLisp)
  var result = execute(compiledLisp)
  return [result, compiledLisp]
}

function execute (compiledLisp) {
  var onError = function(e){ console.error(e); }
  var biwa = new BiwaScheme.Interpreter(onError)
  return biwa.evaluate(compiledLisp)
}

function sort_porder(array) {
  //var array = raw_array.copy()
  for (var i=0; i<array.length - 1; i++) {
    for (var j=i+1; j<array.length; j++) {
      if (array[i].compare(array[j]) > 0) {
        var temp = array[i]
        array[i] = array[j]
        array[j] = temp
      }
    }
  }
  return array
}

function flatten (arrayOfArrays) {
  return [].concat.apply([], arrayOfArrays)
}

module.exports = compileCanvas
