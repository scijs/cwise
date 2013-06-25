"use strict"

var parse = require("cwise-parser")
var createThunk = require("./lib/thunk.js")

var REQUIRED_FIELDS = [ "args", "body" ]
var OPTIONAL_FIELDS = [ "pre", "post", "printCode", "funcName" ]

function Procedure() {
  this.argTypes = []
  this.shimArgs = []
  this.arrayArgs = []
  this.scalarArgs = []
  this.indexArgs = []
  this.shapeArgs = []
  this.funcName = ""
  this.pre = null
  this.body = null
  this.post = null
  this.debug = false
}

function createCWise(user_args) {

  //Check parameters
  for(var id in user_args) {
    if(REQUIRED_FIELDS.indexOf(id) < 0 &&
       OPTIONAL_FIELDS.indexOf(id) < 0) {
      throw new Error("cwise: Unknown argument '"+id+"' passed to expression compiler")
    }
  }
  for(var i=0; i<REQUIRED_FIELDS.length; ++i) {
    if(!user_args[REQUIRED_FIELDS[i]]) {
      throw new Error("cwise: Missing argument: " + REQUIRED_FIELDS[i])
    }
  }
  
  //Create procedure
  var proc = new Procedure()
  
  //Parse arguments
  var proc_args = user_args.args.slice(0)
  proc.argTypes = proc_args
  for(var i=0; i<proc_args.length; ++i) {
    switch(proc_args[i]) {
      case "array":
        proc.arrayArgs.push(i)
        proc.shimArgs.push("array" + i)
      break
      case "scalar":
        proc.scalarArgs.push(i)
        proc.shimArgs.push("scalar" + i)
      break
      case "index":
        proc.indexArgs.push(i)
      break
      case "shape":
        proc.shapeArgs.push(i)
      break
      default:
        throw new Error("cwise: Unknown argument type " + proc_args[i])
    }
  }
  
  //Make sure at least one array argument was specified
  if(proc.arrayArgs.length <= 0) {
    throw new Error("cwise: No array arguments specified")
  }
  
  //Parse blocks
  proc.pre    = parse(user_args.pre || function(){})
  proc.body   = parse(user_args.body)
  proc.post   = parse(user_args.post || function(){})
  
  //Check debug flag
  proc.debug  = !!user_args.printCode
  
  //Retrieve name
  proc.funcName = user_args.funcName || user_args.body.name
  
  //Assemble thunk
  return createThunk(proc)
}

module.exports = createCWise
