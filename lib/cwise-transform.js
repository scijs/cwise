"use strict"

var staticModule = require("static-module")

function cwiseTransform(file, opts) {
  console.log("running transform")
  var sm = staticModule({
    cwise: function(userArgs) {
      console.log(userArgs)
    }
  }, { vars: opts.vars })
  return sm
}