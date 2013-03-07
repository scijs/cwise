"use strict"

var falafel = require("falafel")

function isGlobal(identifier) {
  if(typeof(window) !== "undefined") {
    return identifier in window
  } else if(typeof(GLOBAL) !== "undefined") {
    return identifier in GLOBAL
  } else {
    return false
  }
}

function Scope(array_names, array_args, scalar_names, scalar_args, index_name, index_arg) {
  this.array_names = array_names
  this.array_args = array_args
  this.scalar_names = scalar_names
  this.scalar_args = scalar_args
  this.index_name = index_name
  this.index_arg = index_arg
}

Scope.prototype.rename = function(identifier) {
  var argn
  if(isGlobal(identifier) || identifier === "this") {
    return identifier
  }
  argn = this.array_names.indexOf(identifier)
  if(argn >= 0) {
    return "arr" + argn + "[ptr" + argn + "]"
  }
  argn = this.scalar_names.indexOf(identifier)
  if(argn >= 0) {
    return "scalar" + argn
  }
  if(identifier === this.index_name) {
    return "index"
  }
  return "inline_" + identifier
}

function getScope(func, options) {
  var scalars = options.scalars || []
    , src = "(" + func + ")()"
    , array_names = []
    , array_args = []
    , scalar_names = []
    , scalar_args = []
    , index_name = ""
    , index_arg = typeof(options.index) !== "undefined" ? options.index : -1
  falafel(src, function(node) {
    var i, n
    if(node.type === "FunctionExpression" &&
       node.parent.parent.parent.type === "Program") {
      for(i=0; i<node.params.length; ++i) {
        n = node.params[i].name;
        if(i === index_arg) {
          index_name = n
        } else if(scalars.indexOf(i) >= 0) {
          scalar_names.push(n)
          scalar_args.push(i)
        } else {
          array_names.push(n)
          array_args.push(i)
        }
      }
    }
  });
  return new Scope(array_names,
                   array_args,
                   scalar_names,
                   scalar_args,
                   index_name,
                   index_arg)
}

function inlineFunction(func, scope) {
  var src = "(" + func + ")()"
    , stripped = ""  
  falafel(src, function(node) {
    if(node.type === "Identifier") {
      if(node.parent.type === "MemberExpression" &&
         node.parent.property === node &&
         !node.parent.computed) {
      } else {
        node.update(scope.rename(node.name))
      }
    } else if(node.type === "FunctionExpression" &&
              node.parent.parent.parent.type === "Program") {
      stripped = node.body.source()
    }
  })
  console.log(stripped)
  return stripped
}

function Procedure(scope, pre, body, post, options) {
  this.scope = scope
  this.pre = pre
  this.body = body
  this.post = post
  this.unroll = options.unroll || 1
}

Procedure.prototype.numArgs = function() {
  return this.scope.array_args.length + this.scope.scalar_args.length
}
Procedure.prototype.numArrayArgs = function() {
  return this.scope.array_args.length
}
Procedure.prototype.numScalarArgs = function() {
  return this.scope.scalar_args.length
}
Procedure.prototype.hasIndex = function() {
  return this.scope.index_arg >= 0
}
Procedure.prototype.hasThis = function() {
  return true
}

function preprocess(func, options) {
  var scope = getScope(func, options)
    , body = inlineFunction(func, scope)
    , pre = ""
    , post = ""
  if(options.pre) {
    pre = inlineFunction(options.pre, getScope(options.pre, options))
  }
  if(options.post) {
    post = inlineFunction(options.post, getScope(options.post, options))
  }
  return new Procedure(scope, pre, body, post, options)
}

module.exports = preprocess
