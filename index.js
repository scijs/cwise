"use strict"

var Parser = require("./lib/parser.js")
  , createShim = require("./lib/shim.js")

var REQUIRED_FIELDS = [ "args", "body" ]
var OPTIONAL_FIELDS = [ "pre", "post", "printCode" ]

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
  this.printCode = false
}

function compile(user_args) {
  for(var id in user_args) {
    if(REQUIRED_FIELDS.indexOf(id) < 0 &&
       OPTIONAL_FIELDS.indexOf(id) < 0) {
      throw new Error("Unknown argument '"+id+"' passed to expression compiler")
    }
  }
  for(var i=0; i<REQUIRED_FIELDS.length; ++i) {
    if(!user_args[REQUIRED_FIELDS[i]]) {
      throw new Error("Missing argument: " + REQUIRED_FIELDS[i])
    }
  }
  //Parse arguments
  var proc = new CompiledProcedure()
  var proc_args = user_args.args.slice(0)
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
    , pre = user_args.pre || null
    , body = user_args.body
    , post = user_args.post || null
  parser.preprocess(pre)
  parser.preprocess(body)
  parser.preprocess(post)
  proc.pre  = parser.preBlock() + "\n" + parser.process(pre)
  proc.body = parser.process(body)
  proc.post = parser.process(post) + "\n" + parser.postBlock()
  proc.hasReturn = parser.hasReturn
  
  //Parse options
  proc.printCode = user_args.printCode || false
  
  //Assemble shim
  return createShim(shim_args, proc)
}

module.exports = compile
