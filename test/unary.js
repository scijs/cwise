var cwise = require("../cwise.js")
  , ndarray = require("ndarray")
  , test = require("tap").test

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
  
  function testUnary1D(arr) {
    console.log(arr.shape.toString())
    for(var i=0; i<arr.shape[0]; ++i) {
      arr.set(i, i)
    }
    unary(arr)
    for(var i=0; i<arr.shape[0]; ++i) {
      t.equals(arr.get(i), i+1, arr.shape + "/" + arr.stride)
    }
  }
  var simple_zeros = ndarray(new Int32Array(4096))
  
  testUnary1D(simple_zeros.hi(0))
  testUnary1D(simple_zeros.hi(1))
  testUnary1D(simple_zeros.hi(2))
  testUnary1D(simple_zeros)
  testUnary1D(simple_zeros.hi(31))
  testUnary1D(simple_zeros.hi(32))
  testUnary1D(simple_zeros.hi(33))
  testUnary1D(simple_zeros.step(-1))
  testUnary1D(simple_zeros.step(3))
  testUnary1D(simple_zeros.step(4))
  testUnary1D(simple_zeros.step(5).lo(10))
  
  var custom_zeros = ndarray(new DumbStorage(4096))

  testUnary1D(custom_zeros.hi(0))
  testUnary1D(custom_zeros.hi(1))
  testUnary1D(custom_zeros.hi(2))
  testUnary1D(custom_zeros)
  testUnary1D(custom_zeros.hi(31))
  testUnary1D(custom_zeros.hi(32))
  testUnary1D(custom_zeros.hi(33))
  testUnary1D(custom_zeros.step(-1))
  testUnary1D(custom_zeros.step(3))
  testUnary1D(custom_zeros.step(4))
  testUnary1D(custom_zeros.step(5).lo(10))
  
  function testUnary2D(arr) {
    for(var i=0; i<arr.shape[0]; ++i) {
      for(var j=0; j<arr.shape[1]; ++j) {
        arr.set(i,j, i+j*arr.shape[0])
      }
    }
    unary(arr)
    for(var i=0; i<arr.shape[0]; ++i) {
      for(var j=0; j<arr.shape[1]; ++j) {
        t.equals(arr.get(i,j), 1+i+j*arr.shape[0])
      }
    }
  }
  
  var M = ndarray(new Int32Array(128*128), [128,128])
  testUnary2D(M)
  testUnary2D(M.hi(10, 10))
  testUnary2D(M.lo(100,1))
  testUnary2D(M.transpose(1,0))
  testUnary2D(M.step(-1, 1))
  testUnary2D(M.step(-5, -2))
  testUnary2D(M.step(16, 3))
  
  M = ndarray(new DumbStorage(128*128), [128,128])
  testUnary2D(M)
  testUnary2D(M.hi(10, 10))
  testUnary2D(M.lo(100,1))
  testUnary2D(M.transpose(1,0))
  testUnary2D(M.step(-1, 1))
  testUnary2D(M.step(-5, -2))
  testUnary2D(M.step(16, 3))
  
  t.end()
})
