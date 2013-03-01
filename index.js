var falafel = require("falafel")

var RECURSION_LIMIT = 32

function stripFunction(func, scalars) {
  var src = "(" + func + ")()"
    , array_args = []
    , scalar_args = []
    , array_indices = []
    , scalar_indices = []
  falafel(src, function(node) {
    if(node.type === "FunctionExpression" &&
       node.parent.parent.parent.type === "Program") {
      for(var i=0; i<node.params.length; ++i) {
        var n = node.params[i].name;
        if(scalars.indexOf(n) >= 0) {
          scalar_args.push(n)
          scalar_indices.push(i)
        } else {
          array_args.push(n)
          array_indices.push(i)
        }
      }
    }
  });
  var stripped = "";
  falafel(src, function(node) {
    if(node.type === "Identifier") {
      var argn = array_args.indexOf(node.name)
      if(argn >= 0) {
        node.update("arr" + argn + "[ptr" + argn + "]")
      } else {
        argn = scalar_args.indexOf(node.name)
        if(argn >= 0) {
          node.update("scalars[" + argn + "]")
        } else {
          node.update("inline_" + node.source())
        }
      }
    } else if(node.type === "FunctionExpression" &&
              node.parent.parent.parent.type === "Program") {
      stripped = node.body.source()
    }
  })
  return {
    array_args: array_args,
    scalar_args: scalar_args,
    source: stripped
  }
}

function compare1st(a,b) { return a[0] - b[0]; }

function getOrder(stride) {
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

function innerFill(matched, orders, stripped) {
  var code = []
  var order = orders[0]
  var idx, pidx
  for(var i=matched-1; i>=0; --i) {
    idx = order[i]
    code.push("for(var i"+idx+"=shape["+idx+"]-1;i"+idx+">=0;--i"+idx+"){")
  }
  code.push(stripped)
  for(var i=matched-1; i>=0; --i) {
    idx = order[i]
    if(i > 0) {
      pidx = order[i-1]
      for(var j=0; j<orders.length; ++j) {
        code.push("ptr"+j+"+=stride"+j+"["+idx+"]-shape["+pidx+"]*stride"+j+"["+pidx+"]")
      }
    } else {
      for(var j=0; j<orders.length; ++j) {
        code.push("ptr"+j+"+=stride"+j+"["+idx+"]")
      }
    }
    code.push("}")
  }
  idx = order[matched-1]
  for(var j=0; j<orders.length; ++j) {
    code.push("ptr"+j+"-=shape["+idx+"]*stride"+j+"["+idx+"]")
  }
  return code.join("\n")
}

/*
 function outerFill(matched, orders, stripped) {
 var code = []
 code.push("while(true) {")
 code.push("var max_shape=" + RECURSION_LIMIT)
 code.push(",max_p_shape=" + RECURSION_LIMIT)
 code.push(",max_d = matched")
 
 code.push("for(var i="+matched+"; i<"+orders.length + ";++i){")
 code.push("if(cshape[i]>max_shape){")
 code.push("max_p_shape = max_shape")
 code.push("max_shape=cshape[i]")
 code.push("max_d=i")
 code.push("}")
 code.push("}")
 
 code.push("if(max_shape<="+RECURSION_LIMIT+"){")
 code.push(innerFill(matched, orders, stripped))
 code.push("}")
 
 code.push("}")
 return code.join("\n")
 }
 */

function generateCode(orders, stripped) {
  var code = [];
  code.push("var shape=array_args[0].shape")
  code.push(",cshape=shape.slice(0)")
  for(var i=0; i<orders.length; ++i) {
    code.push(",arr" + i + "=array_args[" + i + "].data")
    code.push(",ptr" + i + "=array_args[" + i + "].offset")
    code.push(",stride" + i + "=array_args[" + i + "].stride")
  }
  
  /*
  var dimension = orders[0].length;
  var nargs = orders.length;

  //Compute which orders match
  var matched = 0;
  matched_loop:
  while(matched < dimension) {
  for(var j=1; j<nargs; ++j) {
  if(orders[j][matched] !== orders[0][matched]) {
  break matched_loop;
  }
  }
  ++matched;
  }
  */
  
  code.push(innerFill(orders[0].length, orders, stripped))
  
  console.log(code.join("\n"))
  
  return new Function("array_args", "scalars", code.join("\n"))
}

function createShim(func, scalars) {
  if(!scalars) {
    scalars = []
  }
  var parsed = stripFunction(func);
  console.log(parsed)
  var memoized = {}
  function executeCWise() {
    if(arguments.length !== parsed.array_args.length + parsed.scalar_args.length) {
      throw new Error("Invalid arguments")
    }
    //Unpack array arguments
    var array_args  = new Array(parsed.array_args.length)
    var orders      = new Array(parsed.array_args.length)
    for(var i=0; array_args.length; ++i)
      array_args[i] = arguments[parsed.array_args[i]]
      if(i > 0) {
        var a_shape = array_args[0].shape
        var b_shape = array_args[i].shape
        if(a_shape.length !== b_shape.length) {
          throw new Error("Dimension mismatch")
        }
        for(var j=0; j<a_shape.length; ++j) {
          if(a_shape[j] !== b_shape[j]) {
            throw new Error("Shape mismatch")
          }
        }
      }
    orders[i] = getOrder(array_args[i].stride)
    //Unpack scalar arguments
    var scalar_args = new Array(parsed.scalar_args.length)
    for(var i=0; i<scalar_args.length; ++i) {
      scalar_args[i] = arguments[parsed.scalar_args[i]]
    }
    //Check for memoized procedure, rebuild if not present
    var ord_str = orders.join(',')
    var proc = memoized[ord_str]
    if(!proc) {
      proc = generateCode(orders, stripped.source)
      memoized[ord_str] = proc;
    }
    proc(array_args, scalar_args)
  }
  return executeCWise
}

module.exports = createShim
