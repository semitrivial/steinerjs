var steiner = require('./stei.js').appx_steiner;

var successes = 0;
var failures = 0;

function reverse_edges(edges) {
  return edges.map(function(e) {
    return [e[1],e[0],e[2]];
  });
}

function test(a,b,c,expected) {
//  console.log("Testing...");
//  console.log("Nodes: " + a );
//  console.log("Edges: " + JSON.stringify(b) );
//  console.log("Required nodes: " + c );
  var expected = JSON.stringify(expected);
  var got = JSON.stringify(steiner(a,b,c));
  console.log("Expected:");
  console.log(expected);
  console.log("Got:");
  console.log(got);

  if ( expected === got ) successes++;
  else failures++;
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
test(nodes, edges, reqds, [[1,2,1],[2,9,1],[8,2,1],[6,5,1],[5,4,1],[4,3,1],[3,2,1]]);

nodes = [1,2,3,4,5,6,7,8,9];
edges = [[1,2,1],[2,3,1],[3,4,1],[4,5,1],[5,6,1],[1,7,2],[7,6,2],[8,2,1],[2,9,1]];
edges = edges.concat(reverse_edges(edges));
reqds = [1,6,8,9];
test(nodes, edges, reqds, [[1,2,1],[2,9,1],[8,2,1],[6,7,2],[7,1,2]]);

nodes = [1];
edges = [];
reqds = [1];
test(nodes,edges,reqds,[]);

nodes = [1,2,3];
edges = [[1,2,1],[2,3,1]];
reqds = [1];
test(nodes,edges,reqds,[]);

console.log( "Successes: " + successes + ", failures: " + failures );
