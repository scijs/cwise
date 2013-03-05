"use strict"

var preprocessor = require("./lib/preprocessor.js")
var shim = require("./lib/shim.js")

function compile(func, options) {
  var proc = preprocessor(func, options || {})
  if(proc.numArrayArgs() === 0) {
    throw new Error("Invalid map/reduce procedure, no array arguments")
  }
  return shim(proc)
}

module.exports = compile
