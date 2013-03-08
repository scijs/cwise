"use strict"

var Parser = require("./parser.js")
  , createShim = require("./shim.js")

function CompiledProcedure() {
  this.numArgs = 0
  this.numArrayArgs = 0
  this.numScalarArgs = 0
  this.hasIndex = false
  this.hasShape = false
  this.hasReturn = false
  this.pre = ""
  this.body = ""
  this.post = ""
  this.unroll = 1

  //Debug options
  this.printCode = false
}

function compile(builder) {
  //Parse arguments
  var proc = new CompiledProcedure()
  var proc_args = builder._args.slice(0)
  var shim_args = []
  for(var i=0; i<proc_args.length; ++i) {
    switch(proc_args[i]) {
      case "array":
        shim_args.push("array" + proc.numArrayArgs)
        proc_args[i] += (proc.numArrayArgs++)
      break
      case "scalar":
        shim_args.push("scalar" + proc.numScalarArgs)
        proc_args[i] += (proc.numScalarArgs++)
      break
      case "index":
        proc.hasIndex = true
      break
      case "shape":
        proc.hasShape = true
      break
      default:
        throw new Error("Unknown argument types")
    }
  }
  if(proc.numArrayArgs <= 0) {
    throw new Error("No array arguments specified")
  }
  
  //Parse blocks
  var parser = new Parser(proc_args)
  parser.preprocess(builder._pre)
  parser.preprocess(builder._body)
  parser.preprocess(builder._post)
  proc.pre  = parser.preBlock() + "\n" + parser.process(builder._pre)
  proc.body = parser.process(builder._body)
  proc.post = parser.process(builder._post) + "\n" + parser.postBlock()
  proc.hasReturn = parser.hasReturn
  
  //Parse options
  var options = builder._options
  proc.unroll = options.unroll || 1
  proc.printCode = options.printCode || false
  
  //Assemble shim
  return createShim(shim_args, proc)
}

module.exports = compile
