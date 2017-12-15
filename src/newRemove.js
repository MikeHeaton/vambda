// We need to override the 'remove' method so that it doesn't remove children.
// Maybe we can do other interesting stuff too, later?
newRemove = function (notifyRenderer) {
  removeFromArray = function (arr, ele, manyCopies) {
    for (var i = arr.length; i >= 0; i--) {
      if (arr[i] === ele) {
        arr.splice(i, 1);

        if (!manyCopies) {
          break;
        }
      }
    }
  };

  var self = this;
  var removed = [];
  var elesToRemove = [];
  var elesToRemoveIds = {};
  var cy = self._private.cy;

  if (notifyRenderer === undefined) {
    notifyRenderer = true;
  }

  // add connected edges
  function addConnectedEdges(node) {
    var edges = node._private.edges;
    for (var i = 0; i < edges.length; i++) {
      add(edges[i]);
    }
  }

  /*
  THIS SECTION REMOVED FROM ORIGINAL
  THIS SECTION REMOVED FROM ORIGINAL
  THIS SECTION REMOVED FROM ORIGINAL
  THIS SECTION REMOVED FROM ORIGINAL

  // add descendant nodes
  function addChildren(node) {
    var children = node._private.children;

    for (var i = 0; i < children.length; i++) {
      add(children[i]);
    }
  }
  THIS SECTION REMOVED FROM ORIGINAL
  THIS SECTION REMOVED FROM ORIGINAL
  THIS SECTION REMOVED FROM ORIGINAL
  THIS SECTION REMOVED FROM ORIGINAL
  */

  function addAbandonedParents(ele, elessToRemoveIds) {
    var parent = ele.parent();
    if (parent.length > 0) {
      var undeletedSiblings = parent.children().filter(function(ele, i, eles) {
        return !elesToRemoveIds[ele.id()]
      });
      if (undeletedSiblings.length == 0) {
        add(parent)
      }
    }
  }

  function add(ele) {
    var alreadyAdded = elesToRemoveIds[ele.id()];
    if (alreadyAdded) {
      return;
    } else {
      elesToRemoveIds[ele.id()] = true;
    }

    if (ele.isNode()) {
      elesToRemove.push(ele); // nodes are removed last
      addAbandonedParents(ele, elesToRemoveIds)
      addConnectedEdges(ele);
      // addChildren(ele);
    } else {
      elesToRemove.unshift(ele); // edges are removed first
    }
  }

  /* THIS SECTION ADDED TO ORIGINAL
  THIS SECTION ADDED TO ORIGINAL
  THIS SECTION ADDED TO ORIGINAL
  THIS SECTION ADDED TO ORIGINAL
  */

  /*
  THIS SECTION ADDED TO ORIGINAL
  THIS SECTION ADDED TO ORIGINAL
  THIS SECTION ADDED TO ORIGINAL
  THIS SECTION ADDED TO ORIGINAL
  */

  // make the list of elements to remove
  // (may be removing more than specified due to connected edges etc)

  for (var i = 0, l = self.length; i < l; i++) {
    var ele = self[i];
    add(ele);
  }

  function removeEdgeRef(node, edge) {
    var connectedEdges = node._private.edges;

    removeFromArray(connectedEdges, edge);

    // removing an edges invalidates the traversal cache for its nodes
    node.clearTraversalCache();
  }

  function removeParallelRefs(edge) {
    // removing an edge invalidates the traversal caches for the parallel edges
    edge.parallelEdges().clearTraversalCache();
  }

  var alteredParents = [];
  alteredParents.ids = {};

  function removeChildRef(parent, ele) {
    ele = ele[0];
    parent = parent[0];

    var children = parent._private.children;
    var pid = parent.id();

    removeFromArray(children, ele);

    if (!alteredParents.ids[pid]) {
      alteredParents.ids[pid] = true;
      alteredParents.push(parent);
    }
  }

  self.dirtyCompoundBoundsCache();

  cy.removeFromPool(elesToRemove); // remove from core pool

  for (var _i5 = 0; _i5 < elesToRemove.length; _i5++) {
    var _ele3 = elesToRemove[_i5];

    // mark as removed
    _ele3._private.removed = true;

    // add to list of removed elements
    removed.push(_ele3);

    if (_ele3.isEdge()) {
      // remove references to this edge in its connected nodes
      var src = _ele3.source()[0];
      var tgt = _ele3.target()[0];

      removeEdgeRef(src, _ele3);
      removeEdgeRef(tgt, _ele3);
      removeParallelRefs(_ele3);
    } else {
      // remove reference to parent
      var parent = _ele3.parent();

      if (parent.length !== 0) {
        removeChildRef(parent, _ele3);
      }
    }
  }

  // check to see if we have a compound graph or not
  var elesStillInside = cy._private.elements;
  cy._private.hasCompoundNodes = false;
  for (var _i6 = 0; _i6 < elesStillInside.length; _i6++) {
    var _ele4 = elesStillInside[_i6];

    if (_ele4.isParent()) {
      cy._private.hasCompoundNodes = true;
      break;
    }
  }

  if (removed.length > 0) {
    var removedElements = this.cy().$(removed.map(e => '#'+e.id()).join(','));
    if (notifyRenderer) {
      this.cy().notify({
        type: 'remove',
        eles: removedElements
      });
    }
    removedElements.emit('remove');
  }

  /*if (removedElements.size() > 0) {
    // must manually notify since trigger won't do this automatically once removed
  }*/

  // the parents who were modified by the removal need their style updated
  for (var _i7 = 0; _i7 < alteredParents.length; _i7++) {
    var _ele5 = alteredParents[_i7];

    if (!_ele5.removed()) {
      _ele5.updateStyle();
    }
  }

  //return new Collection(cy, removed);
};

module.exports = newRemove;
