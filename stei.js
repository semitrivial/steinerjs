var create_new_fifo = require('fifo');

function steiner(nodes, edges, required) {
  var xnodes = [];
  var xedges = [];

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
      in_permanent_web: false,
      in_temporary_web: false,
      witness: null,
      fifo: []
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
      from: get_xnode(e[0]),
      to: get_xnode(e[1]),
      weight: e[2]
    };
    xedges.push(xedge);
    xedge.from.outgoing.push(xedge);
  });

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

  var solved_reqds = 0;
  var soln = [];

  xnodes.forEach(function(n) {
    if ( !n.reqd ) return;
    n.fifo = create_new_fifo();
    var ppath = {point:n, path:[], endweight: 0};
    n.fifo.push(ppath);
  });

  function map_soln(x) {
    return x.map(function(e) {
      return JSON.stringify([e.from.node, e.to.node, e.weight]);
    });
  }

  while ( solved_reqds < reqds ) {
    var fNonemptyFifo;
    while ( true ) {
      var i;
      fNonemptyFifo = false;
      for ( i=0; i<xnodes.length; i++ ) {
        var n = xnodes[i];
        if ( !n.reqd )
          continue;
        if ( n.fifo.isEmpty() || n.in_permanent_web )
          continue;
        fNonemptyFifo = true;
        var ppath = n.fifo.shift();
        if ( ppath.endweight > 1 ) {
          ppath.endweight--;
          n.fifo.push(ppath);
          continue;
        }
        var p = ppath.point;
        var path = ppath.path;
        p.in_temporary_web = true;
        p.witness = {node: n, path:path};
        var j;
        for ( j=0; j<p.outgoing.length; j++ ) {
          var outgoing = p.outgoing[j];
          var to = outgoing.to;
          if ( (to.reqd && to !== n) || to.in_permanent_web ) {
            soln = soln.concat(path).concat([outgoing]);
            path.forEach(function(step) {
              step.from.in_permanent_web = true;
            });
            to.in_permanent_web = true;
            if ( !to.in_permanent_web ) {
              solved_reqds += 2;
            } else {
              solved_reqds++;
            }
            break;
          }
          if ( to.in_temporary_web ) {
            if ( to.witness.node === n )
              continue;
            new_edges = path.concat(to.witness.path).concat([outgoing]);
            soln = soln.concat(new_edges);
            new_edges.forEach(function(step) {
              step.from.in_permanent_web = true;
            });
            to.in_permanent_web = true;
            solved_reqds += 2;
            break;
          }
          new_path = path.concat([outgoing]);
          new_ppath = {point:to, path:new_path, endweight:outgoing.weight};
          n.fifo.push(new_ppath);
        }
        if ( j<p.outgoing.length )
          break;
      }
      if ( !fNonemptyFifo || i < xnodes.length )
        break;
    }
    if ( !fNonemptyFifo )
      break;
  }

  return uniqueify(soln).map(function(e) {
    return [e.from.node, e.to.node, e.weight];
  });
}

exports.appx_steiner = steiner;
