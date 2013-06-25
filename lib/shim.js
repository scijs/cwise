"use strict"

var createCompiler = require("./compiler.js")

function createThunk(proc) {
  var code = ["'use strict'", "var CACHED={}"]
  var thunkName = proc.funcName + "_thunk"
  
  //Build thunk
  code.push(["function ", thunkName, "(", proc.shimArgs.join(","), "){var i"].join(""))
  var typesig = []
  var proc_args = []
  for(var i=0; i<proc.arrayArgs.length; ++i) {
    var j = proc.arrayArgs[i]
    code.push(["var t", j, "=array", j, ".dtype,",
                   "r", j, "=array", j, ".order"].join(""))
    proc_args.push(["array", j, ".data",
                    "array", j, ".shape",
                    "array", j, ".stride",
                    "array", j, ".offset|0"].join(","))
    if(i > 0) {
      var k = proc.arrayArgs[0]
      code.push(["if(s", j, ".length!==s", k, ".length){throw new Error('cwise-runtime: Array shape mismatch')}",
          "for(i=0;i<d;++i){if(s", j, "[i]!==s", k, "[i]){throw new Error('cwise-runtime: Array shape mismatch')}}"].join(""))
    } else {
      code.push(["var d=s",j,".length|0"].join(""))
    }
    typesig.push("t" + j)
    typesig.push("r" + j)
  }
  for(var i=0; i<proc.scalarArgs.length; ++i) {
    proc_args.push("scalar" + proc.scalarArgs[i])
  }
  code.push(["var type=[", typesig.join(","), "].join(':');",
             "var proc=CACHED[type];if(!proc){",
             "CACHED[type]=proc=compile(", typesig.join(","), ")}",
             "return proc(", proc_args.join(","), ")} return ", thunkName, "}"].join(""))
  
  //Compile thunk
  var thunk = new Function("compile", code.join("\n"))
  return thunk(createCompiler(proc))
}

module.exports = createThunk
