# VAMBDA
## Code with drawing.

# Introduction

Computer code permeates every part of our society, all the way down to our watches. Programming languages come in many flavours: we have functional and imperative languages; typed languages; object-oriented; languages for data analysis, for the web and for making art. But almost all serious languages have something in common -- they are all _white text on a black screen_. Unexciting. Opaque. Linear.

Enter Vambda, with one question: when our culture has achieved such richness of expression...
>__Why should all our programming languages look the same??__

Vambda is a visual functional programming language. Instead of describing programs using text, we draw programs in the editor using nodes and arrows. Vambda code is beautiful, playful and _fun_. __Organise__ your code. __Colour__ your code. __Draw on__ your code! Vambda is an invitation to think abut programming in a different way.

Unlike other visual programming languages, Vambda is both general-purpose and fully-featured. Vambda programs compile to Scheme, a dialect of Lisp, so Vambda inherits the rich syntax and power of Lisp. The first iterations of the editor and compiler are written in JS, using [Cytoscape JS](http://js.cytoscape.org/ ) and [BiwaScheme](http://www.biwascheme.org/). The environment is fully web-based: there's nothing to install client-side and setting up is a breeze. Tested in Chrome.

Vambda has been my one-man project for the last couple months. As such, it's still very much in the pre-alpha stages. The UI is buggy and unfinished but Vambda __works__ and it's __fun__. Try it out!

# Getting Started

TBA

# Using Vambda

* The base unit in a Vambda program is the __node__. Nodes represent ideas: some data, or a function.
(A)
* Nodes are joined together by __edges__. Plugging a node A into another node B 'applies' the function B to the input A, forming another piece of data.
(#t)->(not) = '#f'
* Some nodes can take multiple inputs. Chain nodes together to make complex calculations. There's no limit to how long or complex these chains can be!
(+ (* (+ 1 2) 3 4) 1 (+ 2 3)) etc
* Many functions have been pre-defined for you [0]. But you will want to __create your own functions.__
  * Wrap the selected chain in a function bubble (also known as a 'lambda'). The chain is now a function!
  * A function needs its inputs to be specified. Tell Vambda which nodes are the function inputs.
  * Treat the function bubble just like a node! Pass inputs into it, or use it as an input to something else.
  * Can you make sense of these examples?
((lambda (x y) (+ (* x y) (+ x 1))) 3 2)   (lambda (f) (lambda (x y) (+ x y)) (f (f 1 2) 2))
* Give a __name__ to a function bubble, or any group of nodes, to reuse it somewhere else in the program.
* You can nest function bubbles and definition bubbles inside each other.
  * Careful, definitions won't be available outside of their parent bubble.
  * You can 'pass' a variable from an outer function to inside a nested function. But you need to tell Vambda that it's a variable for the _outer_ function, not the _inner_ one.
(define foo (...)) (foo 1)
(define inside a lambda definition)
* Edge names & ordering

# Controlling the UI

* Double-click:
  * In space: create a node.
  * On a node or edge: rename.
* 'e'/'w'-click:
  * In space: create a node, with an edge _from/to_ currently selected node.
  * On a node or bubble: create an edge _from/to_ current selection _to/from_ the clicked item.
* 'p': Wrap selection in a parentheses bubble.
* 'l': Wrap selection in a lambda bubble.
* 'd': define a name for the selection.
* 'r':
  * On a node, edge or definition bubble: rename.
  * On a lambda bubble: specify inputs.
* 'shift-V': Toggle selected node as VARIABLE.
  * In lambda functions, variables (cyan diamond) are the expected inputs.
  * Cyan square has no functional effect but is conventionally used to denote NESTED (2nd order) variables, see EXPLANATION SOMEWHERE.
* Backspace: delete selected items.
* 'c': hold to make COMMENTS. 'c'-click-drag to draw; 'c'-click to make text;
'c'-click-hold-backspace to delete lines or text.


* click-drag: pan
* scroll: zoom
* 'shift'-drag: multiselect (code, not comments)
