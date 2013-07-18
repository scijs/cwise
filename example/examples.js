var cwise = require("../cwise.js")
var ndarray = require("ndarray")
var array = ndarray(new Float32Array(128*128), [128, 128])
var next = ndarray(new Float32Array(128*128), [128,128])
var prev = ndarray(new Float32Array(128*128), [128,128])

//Multiply scalar
var muls = cwise({
  args: ["array", "scalar"],
  body: function(a, s) {
    a *= s
  }
})
muls(array, 2.0)

//Mgrid
var mgrid = cwise({
  args: ["index", "array"],
  body: function(i, a) {
    a = i[0]
  }
})
var X = mgrid(ndarray(new Float32Array(128)))

//Any
var any = cwise({
  args:["array"],
  body:function(a) {
    if(a) {
      return true
    }
  },
  post:function() {
    return false
  }
})
if(any(array)) {
  // ...
}

//Laplacian
var laplacian = cwise({
  args:["array", "array", {offset:[0,1], array:1}, {offset:[0,-1], array:1}, {offset:[1,0], array:1}, {offset:[-1,0], array:1}],
  body:function(a, c, n, s, e, w) {
    a = 0.25 * (n + s + e + w) - c
  }
})

laplacian(next, prev)


//Sum
var sum = cwise({
  args:["array"],
  pre: function() {
    this.sum = 0
  },
  body: function(a) {
    this.sum += a
  },
  post: function() {
    return this.sum
  }
})
s = sum(array)

//Argmin
var argmin = cwise({
  args:["index", "array", "shape"],
  pre: function(i, a, s) {
    this.min_v = Number.POSITIVE_INFINITY
    this.min_index = s.slice(0)
  },
  body: function(index, a) {
    if(a < this.min_v) {
      this.min_v = a
      for(var i=0; i<index.length; ++i) {
        this.min_index[i] = index[i]
      }
    }
  },
  post: function() {
    return this.min_index
  }
})
argmin(array)

