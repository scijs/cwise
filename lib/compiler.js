"use strict"

function Type(dtype, order) {
  this.dtype = dtype
  this.order = order
}

function Compiler(types, thisVars, localVars, pre, post, body) {
}

Compiler.prototype.generate = function(typeSignature) {
}

module.exports = Compiler