var cwise = require("../index.js")
var ndarray = require("ndarray")
var array = ndarray.zeros([128, 128])
var next = ndarray.zeros([128,128])
var prev = ndarray.zeros([128,128])

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
var X = mgrid(ndarray.zeros([128]))

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
var lap_op = cwise({
  args:["array", "array", "array", "array", "array", "array"],
  body:function(a, c, n, s, e, w) {
    a = 0.25 * (n + s + e + w) - c
  }
})

function laplacian(dest, src) {
  lap_op(dest.hi(dest.shape[0]-1,dest.shape[1]-1).lo(1,1)
      , src.hi(src.shape[0]-1,src.shape[0]-1).lo(1,1)
      , src.hi(src.shape[0]-1,src.shape[0]).lo(1,0)
      , src.hi(src.shape[0]-1,src.shape[0]-2).lo(1,2)
      , src.hi(src.shape[0]-2,src.shape[0]-1).lo(0,1)
      , src.hi(src.shape[0],src.shape[0]-1).lo(2,1))
}

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
  args:["index", "array"],
  pre: function(index) {
    this.min_v = Number.POSITIVE_INFINITY
    this.min_index = index.slice(0)
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
argmin(X)



