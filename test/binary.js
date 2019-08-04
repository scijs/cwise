var cwise = require("../cwise")
var ndarray = require("ndarray")

if(typeof test === "undefined") {
  test = require("tape")
}

function DumbStorage(n) {
  this.data = new Int32Array(n)
  this.length = n
}
DumbStorage.prototype.get = function(i) { return this.data[i] }
DumbStorage.prototype.set = function(i, v) { return this.data[i]=v }


test("binary", function(t) {

  var binary = cwise({
    args: ["array", "array", "scalar", "shape", "index"],
    body: function(a,b,t,s,idx) {
      if (!(a===0)) t.fail("idx:"+idx+", shape:"+s+",a:"+a)
      a = b + 1001
    }
  })

  function testBinary1D(P, Q, testName) {
    t.equals(P.shape[0], Q.shape[0], testName + "; shape")
    for(var i=0; i<P.shape[0]; ++i) {
      Q.set(i, i)
      P.set(i, 0)
    }
    binary(P, Q, t)
    for(var i=0; i<P.shape[0]; ++i) {
      if (!(P.get(i) === i+1001)) {
        t.fail(testName + "; encountered " + P.get(i) + " instead of " + (i+1001) + " at " + i)
        return
      }
    }
    t.pass(testName)
  }

  var A = ndarray(new Int32Array(128))
  var B = ndarray(new Int32Array(128))

  testBinary1D(ndarray(new Int32Array(0)), ndarray(new Int32Array(0)), "length==0")
  testBinary1D(ndarray(new Int32Array(1)), ndarray(new Int32Array(1)), "length==1")
  testBinary1D(A, B, "A, B")
  testBinary1D(A.lo(32), B.hi(128-32), "A.lo(32), B.hi(128-32)")
  testBinary1D(A.step(-1), B, "A.step(-1), B")
  testBinary1D(A, B.step(-1), "A, B.step(-1)")

  A = ndarray(new DumbStorage(128))
  B = ndarray(new DumbStorage(128))
  testBinary1D(ndarray(new DumbStorage(0)), ndarray(new DumbStorage(0)), "DS; length==0")
  testBinary1D(ndarray(new DumbStorage(1)), ndarray(new DumbStorage(1)), "DS; length==0")
  testBinary1D(A, B, "DS; A, B")
  testBinary1D(A.lo(32), B.hi(128-32), "DS; A.lo(32), B.hi(128-32)")
  testBinary1D(A.step(-1), B, "DS; A.step(-1), B")
  testBinary1D(A, B.step(-1), "DS; A, B.step(-1)")


  var X = ndarray(new Int32Array(64*64), [64,64])
  var Y = ndarray(new Int32Array(64*64), [64,64])

  function testBinary2D(P, Q, testName) {
    for(var i=0; i<X.shape[0]; ++i) {
      for(var j=0; j<X.shape[1]; ++j) {
        X.set(i,j,-10000)
        Y.set(i,j,-256)
      }
    }
    t.equals(P.shape[0], Q.shape[0], testName + "; shape[0]")
    t.equals(P.shape[1], Q.shape[1], testName + "; shape[1]")
    for(var i=0; i<P.shape[0]; ++i) {
      for(var j=0; j<P.shape[1]; ++j) {
        Q.set(i,j, i*1000 + j)
        P.set(i,j, 0)
      }
    }
    binary(P, Q, t, P.shape)
    for(var i=0; i<P.shape[0]; ++i) {
      for(var j=0; j<P.shape[1]; ++j) {
        if (!(P.get(i,j) === i*1000+j+1001)) {
          t.fail(testName + "; encountered " + P.get(i,j) + " instead of " + (i*1000+j+1001) + " at (" + i + "," + j +")")
          return
        }
      }
    }
    t.pass(testName)
  }


  testBinary2D(X, Y, "X, Y")
  testBinary2D(X.transpose(1,0), Y.transpose(1,0), "X.T, Y.T")
  testBinary2D(X.transpose(1,0), Y, "X.T, Y")
  testBinary2D(X, Y.transpose(1,0), "X, Y.T")
  testBinary2D(X.hi(32,32), Y.hi(32,32), "X.hi(32,32), Y.hi(32,32)")
  testBinary2D(X.hi(31,31), Y.hi(31,31), "X.hi(31,31), Y.hi(31,31)")
  testBinary2D(X.hi(0,32), Y.hi(0,32), "X.hi(0,32), Y.hi(0,32)")
  testBinary2D(X.transpose(1,0).hi(0,32), Y.hi(0,32), "X.T.hi(0,32), Y.hi(0,32)")
  testBinary2D(X.transpose(1,0).hi(33,33), Y.hi(33,33), "X.T.hi(33,33), Y.hi(33,33)")
  testBinary2D(X.transpose(1,0).hi(31,31), Y.hi(31,31), "X.T.hi(31,31), Y.hi(31,31)")

  t.end()
})
