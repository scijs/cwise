var cwise = require("../index.js")
var ndarray = require("ndarray")

var COUNT = 10000

var sum_no_this = cwise(function(a) {
  sum += a
}, {
  pre: function() { var sum = 0 },
  post: function() { return sum }
})

var sum_this = cwise(function(a) {
  this.sum += a
}, {
  pre: function() { this.sum = 0 },
  post: function() { return this.sum }
})

var test_array = ndarray.zeros([128,128,128])

cwise(function(a) { a = Math.random() })(test_array)

//Warm start
sum_no_this(test_array)
var start = new Date()
for(var i=0; i<COUNT; ++i) {
  sum_no_this(test_array)
}
var end = new Date()
console.log(end-start)


sum_this(test_array)
var start = new Date()
for(var i=0; i<COUNT; ++i) {
  sum_this(test_array)
}
var end = new Date()
console.log(end-start)
