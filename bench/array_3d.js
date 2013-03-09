var cwise = require("../index.js")
var ndarray = require("ndarray")


var test_op = cwise({
  args: ["array", "array"],
  body: function(a,b) {
    a += b * 0.5 + 1.0
  }
  //, printCode: true
})

function bench(o0, o1) {
  var a = ndarray.zeros([128,128,128], 'float32', o0)
  var b = ndarray.zeros([128,128,128], 'float32', o1)
  console.log("Testing ", o0, "<-", o1)
  console.log("Warming up...")
  test_op(a,b)
  var start = new Date()
  for(var i=0; i<100; ++i) {
    test_op(a, b)
  }
  var end = new Date()
  console.log("Test:", o0, "<-", o1, "Time:", (end-start))
}

console.log("Running tests...")
bench([0,1,2],[0,1,2])
bench([2,1,0],[2,1,0])
bench([2,1,0],[1,2,0])
bench([0,2,1],[0,1,2])
