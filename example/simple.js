//Import libraries
var cwise = require("../index.js")
  , ndarray = require("ndarray")

//Create operation
var addeq = cwise({
    args: ["array", "array"],
    body: function(a, b) {
      a += b
    }
  })

//Create two 2D arrays
var X = ndarray.zeros([128,128])
var Y = ndarray.zeros([128,128])

//Add them together
addeq(X, Y)
