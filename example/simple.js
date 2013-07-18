//Import libraries
var cwise = require("../cwise.js")
  , ndarray = require("ndarray")

//Create operation
var addeq = cwise({
    args: ["array", "array"],
    body: function(a, b) {
      a += b
    },
    printCode: true
  })

//Create two 2D arrays
var X = ndarray(new Float32Array(128*128), [128,128])
var Y = ndarray(new Float32Array(128*128), [128,128])

//Add them together
addeq(X, Y)
