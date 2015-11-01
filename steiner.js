var create_new_fifo = require('fifo');
var connect = require('./connect.js').connect

/*
 * Input:
 *  nodes: an array of nodes (a node can be anything)
 *  edges: an array of edges.  Each edge should be an object
 *         with 'from', 'to', and 'weight' fields, where 'from'
 *         and 'to' are nodes and 'weight' is a positive integer.
 *         Additional metadata (e.g. species) can be stored in
 *         other fields.
 *  required: an array of 'required' nodes (must be a subset of
 *            the above-mentioned array of nodes).
 */
function steiner(nodes, edges, required) {
  var xnodes = [];
  var xedges = [];

  /*
   * Make copies of nodes and edges that can be annotated,
   * and annotate them.
   */
  function is_reqd(n) {
    for (var i=0; i<required.length; i++) {
      if (required[i] === n) return true;
    }
    return false;
  }

  var reqds = 0;

  nodes.forEach(function(n) {
    var reqd = is_reqd(n);

    if ( reqd )
      reqds++;

    var xnode = {
      node: n,
      reqd: reqd,
      outgoing: [],
      incoming: [],
      in_permanent_web: false,
      in_temporary_web: false,
      in_solution: false,
      in_first_component: false,
      witness: null,
      fifo: null
    };
    xnodes.push(xnode);
  });

  function get_xnode(n) {
    for (var i = 0; i<xnodes.length; i++) {
      if (xnodes[i].node === n) return xnodes[i];
    }
  }

  edges.forEach(function(e) {
    var xedge = {
      edge: e,
      from: get_xnode(e.from),
      to: get_xnode(e.to),
      weight: e.weight,
      in_solution: false,
      in_first_component: false
    };
    xedges.push(xedge);
    xedge.from.outgoing.push(xedge);
    xedge.to.incoming.push(xedge);
  });

  /*
   * Utility function for removing non-unique edges from our solution
   */
  function uniqueify(es) {
    var retval = [];
    es.forEach(function(e) {
      for(var j=0; j<retval.length; j++) {
        if (retval[j].from===e.from && retval[j].to===e.to)
          return;
      }
      retval.push(e);
    });
    return retval;
  }

  /*
   * Keep track of solution as set of edges.
   * We'll be finished when we've solved the right
   * number of required vertices (all of them) or
   * when we're no longer able to solve any more
   * (graph is disconnected).
   */
  var solved_reqds = 0;
  var soln = [];

  /*
   * Prepare to run N simultaneous breadth first searches,
   * one for each required node.  This means we'll need a
   * separate FIFO for each required node.  The FIFO will
   * contain points accessible from that node, along with
   * the paths needed to reach them, along with an "end-
   * weight" which forces an edge of weight W to go through
   * the queue W times.
   *
   * Note: ppath stands for "pointed path"
   */
  xnodes.forEach(function(n) {
    if ( !n.reqd ) return;
    n.fifo = create_new_fifo();
    var ppath = {point:n, path:[], endweight: 0};
    n.fifo.push(ppath);
  });

  /*
   * The main loop: N consecutive breadth first searches,
   * one for each required node.  Search for other required
   * nodes, or for "temporary" paths, or for "permanent" paths.
   * As this search proceeds, it forms "temporary" paths behind it.
   * Once the search is successful, the corresponding path becomes
   * "permanent".  Solution will be the union of such "permanent"
   * paths.
   */
  while ( solved_reqds < reqds ) {
    /*
     * If we haven't solved enough nodes yet, do some more
     * breadth-first searching
     */
    var fNonemptyFifo;
    while ( true ) {
      /*
       * Let the breadth-first searching continue until
       * something is found or until exhaustion (exhaustion
       * will occur when all the unsolved required nodes
       * have empty FIFOs).
       */
      var i;
      fNonemptyFifo = false;
      for ( i=0; i<xnodes.length; i++ ) {
        /*
         * For each i:  Carry out one step of the BFS
         * corresponding to the ith required node
         * (Unless that node is already on a "permanent"
         * path which means it's already solved)
         */
        var n = xnodes[i];
        if ( !n.reqd )
          continue;
        if ( n.fifo.isEmpty() || n.in_permanent_web )
          continue;
        fNonemptyFifo = true;
        var ppath = n.fifo.shift();
        /*
         * Edges with weight W are required to go through
         * the queue W times before they get acknowledged
         *
         * Note: ppath stands for "pointed path"
         */
        if ( ppath.endweight > 1 ) {
          ppath.endweight--;
          n.fifo.push(ppath);
          continue;
        }
        var p = ppath.point;
        var path = ppath.path;

        /*
         * If temporary path from required node n meets required
         * node m (either directly, or by meeting a permanent path
         * spawned by m) then it solves n.  If the meeting was
         * direct, and m was not previously solved, then the path
         * solves m too.
         */
        if ( (p.reqd && p!==n) || p.in_permanent_web ) {
          soln = soln.concat(path);
          path.forEach(function(step) {
            step.from.in_permanent_web = true;
          });
          if ( p.in_permanent_web )
            solved_reqds++;
          else {
            p.in_permanent_web = true;
            solved_reqds += 2;
          }
          continue;
        }
        /*
         * If a temporary path from required node n
         * indirectly meets required node m by meeting
         * a temporary path spawned by m, then the
         * union of the two temporary paths solves both
         * n and m.
         */
        if ( p.in_temporary_web ) {
          /*
           * ...unless n=m in which case then the temporary
           * path has collided with itself: stop growing it.
           */
          if ( p.witness.node === n ) continue;
          new_edges = path.concat(p.witness.path);
          soln = soln.concat(new_edges);
          new_edges.forEach(function(step) {
            step.from.in_permanent_web = true;
          });
          p.in_permanent_web = true;
          solved_reqds += 2;
          break;
        }
        p.in_temporary_web = true;
        p.witness = {node: n, path:path};
        var j;
        for ( j=0; j<p.outgoing.length; j++ ) {
          var outgoing = p.outgoing[j];
          new_path = path.concat([outgoing]);
          new_ppath = {point:outgoing.to, path:new_path, endweight:outgoing.weight};
          n.fifo.push(new_ppath);
        }
      }
      if ( !fNonemptyFifo || i < xnodes.length )
        break;
    }
    if ( !fNonemptyFifo )
      break;
  }

  /*
   * If the result we get is not connected, try to
   * connect it:  this is kind of naive, we brute-force
   * try to connect the first component to the other
   * components and if we succeed, recurse and try again.
   * Needs improvement.
   */
  soln = connect(soln, xedges, xnodes);

  /*
   * Return the solution in terms of the original edges,
   * not the copies we made and scribbled annotations all over.
   */
  return uniqueify(soln).map(function(e) {
    return e.edge;
  });
}

exports.appx_steiner = steiner;
