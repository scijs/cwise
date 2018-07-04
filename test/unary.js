var cwise = require("..")
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

test("unary", function(t) {

  var unary = cwise({
    args: ["array"],
    body: function(a) {
      ++a
    }
  })
  
  function testUnary1D(arr, testName) {
    for(var i=0; i<arr.shape[0]; ++i) {
      arr.set(i, i)
    }
    unary(arr)
    for(var i=0; i<arr.shape[0]; ++i) {
      if (!(arr.get(i) === i+1)) {
        t.fail(testName + "; encountered " + arr.get(i) + " instead of " + (i+1) + " at " + i)
        return
      }
    }
    t.pass(testName)
  }
  var simple_zeros = ndarray(new Int32Array(4096))
  
  testUnary1D(simple_zeros.hi(0), "simple_zeros.hi(0)")
  testUnary1D(simple_zeros.hi(1), "simple_zeros.hi(1)")
  testUnary1D(simple_zeros.hi(2), "simple_zeros.hi(2)")
  testUnary1D(simple_zeros, "simple_zeros")
  testUnary1D(simple_zeros.hi(31), "simple_zeros.hi(31)")
  testUnary1D(simple_zeros.hi(32), "simple_zeros.hi(32)")
  testUnary1D(simple_zeros.hi(33), "simple_zeros.hi(33)")
  testUnary1D(simple_zeros.step(-1), "simple_zeros.step(-1)")
  testUnary1D(simple_zeros.step(3), "simple_zeros.step(3)")
  testUnary1D(simple_zeros.step(4), "simple_zeros.step(4)")
  testUnary1D(simple_zeros.step(5).lo(10), "simple_zeros.step(5).lo(10)")
  
  var custom_zeros = ndarray(new DumbStorage(4096))
  
  testUnary1D(custom_zeros.hi(0), "custom_zeros.hi(0)")
  testUnary1D(custom_zeros.hi(1), "custom_zeros.hi(1)")
  testUnary1D(custom_zeros.hi(2), "custom_zeros.hi(2)")
  testUnary1D(custom_zeros, "custom_zeros")
  testUnary1D(custom_zeros.hi(31), "custom_zeros.hi(31)")
  testUnary1D(custom_zeros.hi(32), "custom_zeros.hi(32)")
  testUnary1D(custom_zeros.hi(33), "custom_zeros.hi(33)")
  testUnary1D(custom_zeros.step(-1), "custom_zeros.step(-1)")
  testUnary1D(custom_zeros.step(3), "custom_zeros.step(3)")
  testUnary1D(custom_zeros.step(4), "custom_zeros.step(4)")
  testUnary1D(custom_zeros.step(5).lo(10), "custom_zeros.step(5).lo(10)")
  
  function testUnary2D(arr, testName) {
    for(var i=0; i<arr.shape[0]; ++i) {
      for(var j=0; j<arr.shape[1]; ++j) {
        arr.set(i,j, i+j*arr.shape[0])
      }
    }
    unary(arr)
    for(var i=0; i<arr.shape[0]; ++i) {
      for(var j=0; j<arr.shape[1]; ++j) {
        if (!(arr.get(i,j) === 1+i+j*arr.shape[0])) {
          t.fail(testName + "; encountered " + arr.get(i,j) + " instead of " + (1+i+j*arr.shape[0]) + " at (" + i + "," + j + ")")
          return
        }
      }
    }
    t.pass(testName)
  }
  
  var M = ndarray(new Int32Array(128*128), [128,128])
  testUnary2D(M, "M")
  testUnary2D(M.hi(10, 10), "M.hi(10, 10)")
  testUnary2D(M.lo(100,1), "M.lo(100,1)")
  testUnary2D(M.transpose(1,0), "M.transpose(1,0)")
  testUnary2D(M.step(-1, 1), "M.step(-1, 1)")
  testUnary2D(M.step(-5, -2), "M.step(-5, -2)")
  testUnary2D(M.step(16, 3), "M.step(16, 3)")
  
  M = ndarray(new DumbStorage(128*128), [128,128])
  testUnary2D(M, "DS; M")
  testUnary2D(M.hi(10, 10), "DS; M.hi(10, 10)")
  testUnary2D(M.lo(100,1), "DS; M.lo(100,1)")
  testUnary2D(M.transpose(1,0), "DS; M.transpose(1,0)")
  testUnary2D(M.step(-1, 1), "DS; M.step(-1, 1)")
  testUnary2D(M.step(-5, -2), "DS; M.step(-5, -2)")
  testUnary2D(M.step(16, 3), "DS; M.step(16, 3)")
  
  t.end()
})
