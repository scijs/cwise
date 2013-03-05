var cwise = require("../index.js")
  , ndarray = require("ndarray")
  , test = require("tap").test

test("binary", function(t) {

  var binary = cwise(function(a,b) {
    a = b + 1
  })
  
  function testBinary1D(P, Q) {
    t.equals(P.shape[0], Q.shape[0])
    for(var i=0; i<P.shape[0]; ++i) {
      Q.set(i, i)
      P.set(i, 0)
    }
    binary(P, Q)
    for(var i=0; i<P.shape[0]; ++i) {
      t.equals(P.get(i), i+1)
    }
  }
  
  var A = ndarray.zeros([128], 'int32')
  var B = ndarray.zeros([128], 'int32')
  
  testBinary1D(ndarray.zeros([0], 'int32'), ndarray.zeros([0], 'int32'))
  testBinary1D(ndarray.zeros([1], 'int32'), ndarray.zeros([1], 'int32'))
  testBinary1D(A, B)
  testBinary1D(A.lo(32), B.hi(128-32))
  testBinary1D(A.step(-1), B)
  testBinary1D(A, B.step(-1))
  
  function testBinary2D(P, Q) {
    t.equals(P.shape[0], Q.shape[0])
    t.equals(P.shape[1], Q.shape[1])
    for(var i=0; i<P.shape[0]; ++i) {
      for(var j=0; j<Q.shape[0]; ++j) {
        Q.set(i,j, (i<<16) + j)
        P.set(i,j, 0)
      }
    }
  }
  
  t.end()
})
