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

function getArgs(src) {
  var args = []
  falafel(src, function(node) {
    var i
    if(node.type === "FunctionExpression" &&
       node.parent.parent.parent.type === "Program") {
      args = new Array(node.params.length)
      for(i=0; i<node.params.length; ++i) {
        args[i] = node.params[i].name
      }
    }
  })
  return args
}

function Parser(args) {
  this.args = args
  this.this_vars = []
  this.computed_this = false
  this.prefix_count = 0
  this.hasReturn = false
}

//Preprocessing pass is needed to explode the "this" object
Parser.prototype.preprocess = function(func) {
  if(!func || this.computed_this) {
    return
  }
  var src = "(" + func + ")()"
    , this_vars = this.this_vars
    , computed_this = this.computed_this
  falafel(src, function(node) {
    var n
    if(node.type === "ThisExpression") {
      if(node.parent.type === "MemberExpression" && !node.parent.computed) {
        n = node.parent.property.name
        if(this_vars.indexOf(n) < 0) {
          this_vars.push(n)
        }
      } else {
        computed_this = true
      }
    }
  })
  if(computed_this) {
    this.this_vars = []
  }
  this.computed_this = computed_this
}

Parser.prototype.process = function(func) {
  if(!func) {
    return ""
  }
  var label = this.prefix_count++
    , src = "(" + func + ")()"
    , block_args = getArgs(src)
    , proc_args = this.args
    , result = ""
    , inline_prefix = "inline" + label + "_"
    , hasReturn = this.hasReturn
  falafel(src, function(node) {
    var n, i, j
    if(node.type === "FunctionExpression" &&
       node.parent.parent.parent.type === "Program") {
      result = node.body.source()
    } else if(node.type === "Identifier") {
      if(node.parent.type === "MemberExpression") {
        if((node.parent.property === node && !node.parent.computed) ||
           node.parent.object.type === "ThisExpression") {
          return
        }
      }
      n = node.name
      i = block_args.indexOf(n)
      if(i >= 0) {
        if(i < proc_args.length) {
          if(proc_args[i].indexOf("array") === 0) {
            j = parseInt(proc_args[i].substr(5))
            node.update("arr"+j+"[ptr"+j+"]")
          } else if(proc_args[i] === "shape") {
            node.update("inline_shape")
          } else {
            node.update(proc_args[i])
          }
        } else {
          node.update(inline_prefix + node.source())
        }
      } else if(isGlobal(n)) {
        return
      } else {
        node.update(inline_prefix + node.source())
      }
    } else if(node.type === "MemberExpression") {
      if(node.object.type === "ThisExpression") {
        node.update("this_" + node.property.source().trimLeft())
      }
    } else if(node.type === "ThisExpression") {
      if(node.parent.type !== "MemberExpression") {
        node.update("this_")
      }
    } else if(node.type === "ReturnStatement") {
      hasReturn = true
    }
  })
  this.hasReturn = hasReturn
  var prefix = ""
  for(var i=this.args.length; i<block_args.length; ++i) {
    prefix += "var " + block_args[i] + "\n"
  }
  return prefix + result
}

Parser.prototype.preBlock = function() {
  if(this.computed_this) {
    return "var this_={}"
  } else if(this.this_vars.length > 0) {
    return "var this_" + this.this_vars.join(",this_")
  } else {
    return ""
  }
}

Parser.prototype.postBlock = function() {
  return ""
}

module.exports = Parser