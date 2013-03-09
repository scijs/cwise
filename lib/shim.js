"use strict"

var generate = require("./generate.js")

//Reuse stack across all shims
var STACK = new Int32Array(1024)

function Shim(procedure) {
  this.memoized = {}
  this.procedure = procedure
}

Shim.prototype.checkShape = function(a, b) {
  if(a.length !== b.length) {
    throw new Error("Shape mismatch")
  }
  for(var i=a.length-1; i>=0; --i) {
    if(a[i] !== b[i]) {
      throw new Error("Shape mismatch")
    }
  }
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

function createShim(shim_args, procedure) {
  var code = ["\"use strict\""], i
  //Check shapes
  for(i=1; i<procedure.numArrayArgs; ++i) {
    code.push("this.checkShape(array0.shape,array"+i+".shape)")
  }
  //Load/lazily generate procedure based on array ordering
  code.push("var proc = this.getProc([")
  for(i=0; i<procedure.numArrayArgs; ++i) {
    code.push((i>0 ? "," : "") + "this.getOrder(array"+i+".stride)")
  }
  code.push("])")
  //Call procedure
  if(procedure.hasReturn) {
    code.push("return proc(")
  } else {
    code.push("proc(")
  }
  code.push("this.getStack(" + procedure.numArrayArgs + "*(array0.shape.length*32)), array0.shape.slice(0)")
  //Bind array arguments
  for(i=0; i<procedure.numArrayArgs; ++i) {
    code.push(",array" + i + ".data")
    code.push(",array" + i + ".offset")
    code.push(",array" + i + ".stride")
  }
  //Bind scalar arguments
  for(var i=0; i<procedure.numScalarArgs; ++i) {
    code.push(",scalar"+i)
  }
  code.push(")")
  if(!procedure.hasReturn) {
    code.push("return array0")
  }
  //Create the shim
  shim_args.push(code.join("\n"))
  var result = Function.apply(null, shim_args)
  if(procedure.printCode) {
    console.log("Generated shim:", result + "")
  }
  return result.bind(new Shim(procedure))
}

module.exports = createShim

