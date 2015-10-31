var create_new_fifo = require('fifo');

function connect(soln, xedges, xnodes) {
  if(soln.length<2) return soln;
  xedges.forEach(function(e) {
    e.in_solution = false;
    e.in_first_component = false;
  });
  xnodes.forEach(function(n) {
    n.in_solution = false;
    n.in_first_component = false;
  });
  soln.forEach(function(e) {
    e.from.in_solution = true;
    e.to.in_solution = true;
    e.in_solution = true;
  });

  function to_first_component(x) {
    x.from.in_first_component = true;
    x.to.in_first_component = true;
    x.in_first_component = true;
    var candidates = x.from.outgoing.concat(x.to.outgoing);
    candidates = candidates.concat(x.from.incoming).concat(x.to.incoming);
    candidates.forEach(function(c) {
      if ( !c.in_solution ) return;
      if ( c.in_first_component ) return;
      to_first_component( c );
    });
  }

  to_first_component(soln[0]);

  for ( var i=0; i<soln.length; i++ ) {
    if ( !soln[i].in_first_component ) break;
  }
  if ( i===soln.length ) return soln;

  var fifo = create_new_fifo();

  xnodes.forEach(function(n) {
    n.witness = n.in_first_component;
    if ( !n.in_first_component ) return;
    n.outgoing.forEach(function(outgoing) {
      fifo.push({point:outgoing.to, path:[outgoing], endweight:outgoing.weight});
    });
  });

  while ( !fifo.isEmpty() ) {
    var ppath = fifo.shift();
    if ( ppath.endweight > 1 ) {
      ppath.endweight--;
      fifo.push(ppath);
      continue;
    }
    var n = ppath.point;
    if ( n.witness ) continue;
    if ( n.in_solution ) {
      return connect(soln.concat(ppath.path),xedges,xnodes);
    }
    n.witness = true;
    n.outgoing.forEach(function(outgoing) {
      fifo.push({point:outgoing.to, path:[outgoing], endweight:outgoing.weight});
    });
  }

  return soln;
}

exports.connect = connect;
