var cwise = require("../index.js")

var addeq = cwise(function(a,b) {
  a += b
})

var ndarray = require("ndarray")

var X = ndarray.zeros([5,5])
var Y = ndarray.zeros([5,5])

addeq(X,Y)