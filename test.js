var steiner = require('./steiner.js').appx_steiner;

var successes = 0;
var failures = 0;

function reverse_edges(edges) {
  return edges.map(function(e) {
    return [e[1],e[0],e[2]];
  });
}

function test(a,b,c,expected) {
  b = b.map(function(e) {
    return {from:e[0], to:e[1], weight:e[2]};
  });
  var expected = JSON.stringify(expected);
  var result = steiner(a,b,c);
  result = result.map(function(e) {
    return [e.from, e.to, e.weight];
  });
  var got = JSON.stringify(result);

  if ( expected !== got ) {
    console.log("FAILURE on the following input");
    console.log("-------------");
    console.log("Nodes: "+JSON.stringify(a));
    console.log("Edges: "+JSON.stringify(b));
    console.log("Required Nodes: "+JSON.stringify(c));
    console.log("-------------");
    console.log("Expected output: "+expected);
    console.log("Actual output: "+got);
    console.log("-------------");
    failures++;
  }
  else successes++;
}

var nodes = [1,2,3];
var edges = [[1,2,1],[1,3,1],[2,3,1],[2,1,1],[3,1,1],[3,2,1]];
var reqds = [1,2,3];
test(nodes,edges,reqds,[ [ 1, 2, 1 ], [ 3, 1, 1 ] ]);

var nodes = [1,2,3,4,5,6,7];
var edges = [[1,2,1],[2,3,1],[3,4,1],[4,5,1],[5,6,1],[1,7,100],[7,6,100]];
var reqds = [1,6];
test(nodes, edges, reqds, [[1,2,1],[2,3,1],[3,4,1],[4,5,1],[5,6,1]]);

var edges = [[1,2,1],[2,3,1],[3,4,1],[4,5,1],[5,6,1],[1,7,1],[7,6,1]];
test(nodes, edges, reqds, [[1,7,1],[7,6,1]]);

nodes = [1,2,3,4,5,6,7,8,9];
edges = [[1,2,1],[2,3,1],[3,4,1],[4,5,1],[5,6,1],[1,7,50],[7,6,50],[8,2,1],[2,9,1]];
edges = edges.concat(reverse_edges(edges));
reqds = [1,6,8,9];
test(nodes, edges, reqds, [[8,2,1],[1,2,1],[9,2,1],[6,5,1],[5,4,1],[4,3,1],[3,2,1]]);

nodes = [1,2,3,4,5,6,7,8,9];
edges = [[1,2,1],[2,3,1],[3,4,1],[4,5,1],[5,6,1],[1,7,2],[7,6,2],[8,2,1],[2,9,1]];
edges = edges.concat(reverse_edges(edges));
reqds = [1,6,8,9];
test(nodes, edges, reqds, [[8,2,1],[1,2,1],[9,2,1],[6,5,1],[5,4,1],[4,3,1],[3,2,1]]);

nodes = [1,2,3,4,5,6,7,8,9];
edges = [[1,2,1],[2,3,1],[3,4,1],[4,5,1],[5,6,1],[1,7,2],[7,6,1],[8,2,1],[2,9,1]];
edges = edges.concat(reverse_edges(edges));
reqds = [1,6,8,9];
test(nodes, edges, reqds, [[8,2,1],[1,2,1],[9,2,1],[6,7,1],[7,1,2]]);

nodes = [1];
edges = [];
reqds = [1];
test(nodes,edges,reqds,[]);

nodes = [1,2,3];
edges = [[1,2,1],[2,3,1]];
reqds = [1];
test(nodes,edges,reqds,[]);

nodes = [1,2,3,4,5,6,7];
edges = [[1,2,1],[6,7,1],[1,3,99],[3,4,99],[4,5,99],[5,6,99]];
reqds = [1,2,6,7];
test(nodes,edges,reqds,[[1,2,1],[6,7,1],[5,6,99],[4,5,99],[3,4,99],[1,3,99]]);

console.log( "Successes: " + successes + ", failures: " + failures );
