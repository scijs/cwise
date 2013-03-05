"use strict"

var generate = require("./generator.js")

//Reuse stack across all shims
var STACK = new Int32Array(1024)

function Shim(procedure) {
  this.memoized = {}
  this.procedure = procedure
}

Shim.prototype.getStack = function(size) {
  if(size < STACK.length) {
    return STACK
  }
  STACK = new Int32Array(size)
  return STACK
}

function compare1st(a,b) { return a[0] - b[0]; }

Shim.prototype.getOrder = function(stride) {
  switch(stride.length) {
    case 1:
      return [ 0 ]
    case 2:
      return Math.abs(stride[0]) > Math.abs(stride[1]) ? [0,1] : [1,0]
    default:
      break;
  }
  var zipped = new Array(stride.length)
  for(var i=0; i<stride.length; ++i) {
    zipped[i] = [Math.abs(stride[i]), i]
  }
  zipped.sort(compare1st)
  var unzipped = new Array(stride.length)
  for(var i=0; i<stride.length; ++i) {
    unzipped[i] = zipped[i][1]
  }
  return unzipped
}

Shim.prototype.getProc = function(orders) {
  var proc_name = orders.join("|")
    , proc = this.memoized[proc_name]
  if(!proc) {
    proc = generate(orders, this.procedure)
    this.memoized[proc_name] = proc
  }
  return proc
}

function createShim(procedure) {
  var shim_args = new Array(1 + procedure.numArgs())
    , code = ["\"use strict\""]
    , i
  //Load/lazily generate procedure based on array ordering
  code.push("var proc = this.getProc([")
  for(i=0; i<procedure.numArrayArgs(); ++i) {
    code.push((i>0 ? "," : "") + "this.getOrder(array"+i+".stride)")
  }
  code.push("])")
  //Call procedure
  code.push("proc(this.getStack(" + procedure.numArrayArgs() + "*(array0.shape.length*28)), array0.shape.slice(0)")
  //Bind array arguments
  for(i=0; i<procedure.numArrayArgs(); ++i) {
    shim_args[procedure.scope.array_args[i]] = "array" + i
    code.push(",array" + i + ".data")
    code.push(",array" + i + ".offset")
    code.push(",array" + i + ".stride")
  }
  //Bind scalar arguments
  for(var i=0; i<procedure.numScalarArgs(); ++i) {
    shim_args[procedure.scope.scalar_args[i]] = "scalar" + i
    code.push(",scalar"+i)
  }
  code.push(")")
  //Create the shim
  shim_args[shim_args.length-1] = code.join("\n")
  console.log("Creating shim:", shim_args)
  return Function.apply(null, shim_args).bind(new Shim(procedure))
}

module.exports = createShim

