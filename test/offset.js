var cwise = require("cwise")
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


test("offset", function(t) {

  var binary = cwise({
    args: ["array", "array", {offset:[1], array:1}, "scalar", "shape", "index"],
    body: function(a,b,c,t,s,idx) {
      if (!(a===0)) t.fail("idx:"+idx+", shape:"+s+",a:"+a)
      a = c + b + 1000
    }
  })
  
  function testBinary1D(P, Q, testName) {
    t.equals(P.shape[0], Q.shape[0]-1, testName + "; shape")
    for(var i=0; i<P.shape[0]; ++i) {
      Q.set(i, i)
      P.set(i, 0)
    }
    Q.set(P.shape[0], P.shape[0])
    binary(P, Q.hi(Q.shape[0]-1), t)
    for(var i=0; i<P.shape[0]; ++i) {
      if (!(P.get(i) === 2*i+1001)) {
        t.fail(testName + "; encountered " + P.get(i) + " instead of " + (2*i+1001) + " at " + i)
        return
      }
    }
    t.pass(testName)
  }
  
  var A = ndarray(new Int32Array(128))
  var B = ndarray(new Int32Array(129))
  
  testBinary1D(ndarray(new Int32Array(0)), ndarray(new Int32Array(1)), "length==0")
  testBinary1D(ndarray(new Int32Array(1)), ndarray(new Int32Array(2)), "length==1")
  testBinary1D(A, B, "A, B")
  testBinary1D(A.lo(32), B.lo(32), "A.lo(32), B.lo(32)")
  testBinary1D(A.step(-1), B, "A.step(-1), B")
  testBinary1D(A, B.step(-1), "A, B.step(-1)")
  
  A = ndarray(new DumbStorage(128))
  B = ndarray(new DumbStorage(129))
  testBinary1D(ndarray(new DumbStorage(0)), ndarray(new DumbStorage(1)), "DS; length==0")
  testBinary1D(ndarray(new DumbStorage(1)), ndarray(new DumbStorage(2)), "DS; length==1")
  testBinary1D(A, B, "DS; A, B")
  testBinary1D(A.lo(32), B.lo(32), "DS; A.lo(32), B.lo(32)")
  testBinary1D(A.step(-1), B, "DS; A.step(-1), B")
  testBinary1D(A, B.step(-1), "DS; A, B.step(-1)")
  
  t.end()
})
