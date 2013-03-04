var cwise = require("../index.js")

var N = 64
var M = 65

var addeq = cwise(function(a,b) {
  //console.log(a,b)
  a += b
})

var ndarray = require("ndarray")

var X = ndarray.zeros([N,M], 'float32', [0,1])
var Y = ndarray.zeros([N,M], 'float32', [1,0])

for(var i=0; i<N; ++i) {
  for(var j=0; j<M; ++j) {
    X.set(i,j, i+j)
    Y.set(i,j, i-j)
  }
}


addeq(X,Y)

console.log(X.toString())
//console.log(Y.toString())