"use strict"

var browserify = require("browserify")
var vm = require("vm")
var path = require("path")
var tape = require("tape")

var cases = [ "unary", "binary", "offset" ]

for(var i=0; i<cases.length; ++i) {
  var b = browserify()
  b.add(__dirname + "/" + cases[i] + ".js")
  b.transform(path.normalize(__dirname + "/../cwise.js"))
  b.bundle(function(err, src) {
    if(err) {
      throw new Error("failed to bundle!")
    }
    vm.runInNewContext(src, { 
      test: tape,
      Buffer: Buffer,
      Int8Array: Int8Array,
      Int16Array: Int16Array,
      Int32Array: Int32Array,
      Float32Array: Float32Array,
      Float64Array: Float64Array,
      Uint8Array: Uint8Array,
      Uint16Array: Uint16Array,
      Uint32Array: Uint32Array,
      Uint8ClampedArray: Uint8ClampedArray,
      console: { log: console.log.bind(console) } })
  })
}