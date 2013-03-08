var cwise = require("../index.js")
var ndarray = require("ndarray")
var array = ndarray.zeros([128, 128])
var next = ndarray.zeros([128,128])
var prev = ndarray.zeros([128,128])

//Multiply scalar
var muls = cwise("array", "scalar")
  .body(function(a, s) {
    a *= s
  })
  .compile()
muls(array, 2.0)

//Mgrid
var mgrid = cwise("index", "array")
  .body(function(i, a) {
    a = i[0]
  })
  .compile()
var X = mgrid(ndarray.zeros([128]))

//Any
var any = cwise("array")
  .begin(function(a) {
    if(a) {
      return true
    }
  })
  .end(function() {
    return false
  })
  .compile()
if(any(array)) {
  // ...
}

//Laplacian
var lap_op = cwise("array", "array", "array", "array", "array", "array")
  .body(function(a, c, n, s, e, w) {
    a = 0.25 * (n + s + e + w) - c
  })
  .compile()

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
var sum = cwise("array")
  .begin(function() {
    this.sum = 0
  })
  .body(function(a) {
    this.sum += a
  })
  .end(function() {
    return this.sum
  })
  .compile()
s = sum(array)

//Argmin
var argmin = cwise("index", "array")
  .begin(function(index) {
    this.min_v = Number.POSITIVE_INFINITY
    this.min_index = index.slice(0)
  })
  .body(function(index, a) {
    if(a < this.min_v) {
      this.min_v = a
      for(var i=0; i<index.length; ++i) {
        this.min_index[i] = index[i]
      }
    }
  })
  .end(function() {
    return this.min_index
  })
  .compile()
argmin(X)



