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

  function dewitness(n) {
console.log("Dewitness called on "+n.node);
    xnodes.forEach(function(m) {
      if ( m.witness !== null && m.witness.node === n ) {
console.log("Dewitnessing "+m.node);
        m.witness = null;
        m.in_temporary_web = false;
      }
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
        var j;
        for ( j=0; j<p.outgoing.length; j++ ) {
          var outgoing = p.outgoing[j];
          var to = outgoing.to;
          if ( (to.reqd && to !== n) || to.in_permanent_web ) {
console.log("Debug1: Adding " + map_soln(path.concat([outgoing])));
            soln = soln.concat(path).concat([outgoing]);
            path.forEach(function(step) {
              step.from.in_permanent_web = true;
            });
            to.in_permanent_web = true;
            dewitness(n);
            if ( to.reqd ) {
              dewitness(to);
              solved_reqds += 2;
            }
            else
              solved_reqds++;
            break;
          }
          if ( to.in_temporary_web ) {
            if ( to.witness.node === n )
              continue;
            new_edges = path.concat(to.witness.path).concat([outgoing]);
console.log("Debug2: Adding " + map_soln(new_edges));
console.log("n="+n.node);
console.log("to="+to.node);
            soln = soln.concat(new_edges);
            new_edges.forEach(function(step) {
              step.from.in_permanent_web = true;
            });
            to.in_permanent_web = true;
            dewitness(to.witness.node);
            dewitness(n);
            solved_reqds += 2;
            break;
          }
          to.in_temporary_web = true;
          to.witness = {node: n, path:path.concat([outgoing])};
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

  return soln.map(function(e) {
    return [e.from.node, e.to.node, e.weight];
  });
}

exports.appx_steiner = steiner;
