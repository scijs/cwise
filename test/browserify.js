"use strict"

var browserify = require("browserify")
var vm = require("vm")
var path = require("path")
var tape = require("tape")

var cases = [ "unary", "binary", "offset" ]
var srcs = new Array(cases.length)
var srcsBundled = 0

bundleCasesFrom(0)

function bundleCasesFrom(i) {
  if (i>=cases.length) return
  var b = browserify()
  b.ignore("tape")
  b.add(__dirname + "/" + cases[i] + ".js")
  b.transform(path.normalize(__dirname + "/../cwise.js"))
  b.bundle(function(err, src) {
    if(err) {
      throw new Error("failed to bundle!")
    }
    srcs[i] = src
    srcsBundled++
    if (srcsBundled === cases.length) runTests()
  })
  bundleCasesFrom(i+1)
}

function runTests() { // Apparently tape does not like to be called asynchronously, so we just wait until everything is bundled, and then run all the tests.
  for(var i=0; i<srcs.length; i++) {
      vm.runInNewContext(srcs[i], { 
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
  }
}
