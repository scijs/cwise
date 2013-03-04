"use strict"

var falafel = require("falafel")

var STACK = new Int32Array(1024)
var RECURSION_LIMIT = 32

function isGlobal(identifier) {
  if(typeof(window) !== "undefined") {
    return identifier in window
  } else if(typeof(GLOBAL) !== "undefined") {
    return identifier in GLOBAL
  } else {
    return false
  }
}

function stripFunction(func, scalars) {
  console.log("stripping function")
  var src = "(" + func + ")()"
    , array_args = []
    , scalar_args = []
    , array_indices = []
    , scalar_indices = []
    , stripped = ""
  falafel(src, function(node) {
    var i, n
    if(node.type === "FunctionExpression" &&
       node.parent.parent.parent.type === "Program") {
      for(i=0; i<node.params.length; ++i) {
        n = node.params[i].name;
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
  falafel(src, function(node) {
    var argn
    if(node.type === "Identifier") {
      argn = array_args.indexOf(node.name)
      if(argn >= 0) {
        node.update("arr" + argn + "[ptr" + argn + "]")
      } else {
        argn = scalar_args.indexOf(node.name)
        if(argn >= 0) {
          node.update("scalar" + argn)
        } else if(isGlobal(node.name) ||
                  node.parent.type === "MemberExpression") {
          //Do nothing
        } else {
          console.log(node.parent)
          node.update("inline_" + node.source())
        }
      }
    } else if(node.type === "FunctionExpression" &&
              node.parent.parent.parent.type === "Program") {
      stripped = node.body.source()
    }
  })
  return {
    array_args: array_indices,
    scalar_args: scalar_indices,
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

function majorOrder(orders) {
  return orders[0]
}

function innerFill(dimension, nargs, order, stripped) {
  var code = [], idx, pidx, i, j
  console.log("ORDER==",order)
  code.push("var i0=0")
  for(i=1; i<dimension; ++i) {
    code.push(",i"+i+"=0")
  }
  //Compute scan deltas
  for(j=0; j<nargs; ++j) {
    for(i=0; i<dimension; ++i) {
      idx = order[i]
      if(i < 1) {
        code.push(",d"+j+"s"+i+"=stride"+j+"["+idx+"]|0")
      } else {
        pidx = order[i-1]
        code.push(",d"+j+"s"+i+"=(stride"+j+"["+idx+"]-shape["+pidx+"]*stride"+j+"["+pidx+"])|0")
      }
    }
  }
  //Outer scan loop
  for(i=dimension-1; i>=0; --i) {
    idx = order[i]
    code.push("for(i"+i+"=(shape["+idx+"]-1)|0;i"+i+">=0;--i"+i+"){")
  }
  //code.push("console.log('inn', shape, i0, i1, ptr0, ptr1)")
  code.push(stripped)
  for(i=0; i<dimension; ++i) {
    idx = order[i]
    for(j=0; j<nargs; ++j) {
      code.push("ptr"+j+"+=d"+j+"s"+i)
    }
    code.push("}")
  }
  pidx = order[dimension-1]
  return code.join("\n")
}

function outerFill(matched, dimension, nargs, order, stripped) {
  var code = []
    , frame_size = nargs + 2
  
  //Initiaize variables
  code.push("var i=0,l=0,v=0,d=0,sp="+frame_size)

  //Push initial frame
  code.push("STACK[0]=0")
  code.push("STACK[1]=shape[0]|0")
  for(var i=0; i<nargs; ++i) {
    code.push("STACK["+(i+2)+"]=ptr"+i)
  }
  
  //Begin recursion
  code.push("while(sp>0) {")
  
    //Pop previous state
    code.push("sp-="+frame_size)
    code.push("shape[STACK[sp]]=STACK[sp+1]")
    for(var i=0; i<nargs; ++i) {
      code.push("ptr"+i+"=STACK[sp+"+(2+i)+"]")
    }
    
    //Walk over runs to get bounds
    code.push("l="+RECURSION_LIMIT)
    code.push("v="+RECURSION_LIMIT)
    code.push("d="+matched)
  
    for(var i=matched; i<dimension; ++i) {
      code.push("if(shape["+i+"]>l){")
        code.push("v=l|0")
        code.push("l=shape["+i+"]|0")
        code.push("d="+i+"|0")
      code.push("}else if(shape["+i+"]>v){")
        code.push("v=shape["+i+"]|0")
      code.push("}")
    }
  
    //code.push("console.log('rec', sp, shape, l, v, d, [STACK[sp], STACK[sp+1], STACK[sp+2], STACK[sp+3]], ptr0, ptr1)")
  
    code.push("if(l<="+RECURSION_LIMIT+"){")
      code.push(innerFill(dimension, nargs, order, stripped))
    code.push("} else {")
  
      //Round v to previous power of 2
      code.push("v=(v>>>1)-1")
      code.push("for(i=1;i<=16;i<<=1) { v |= v >>> i }")
      code.push("++v")
      code.push("if(v<"+RECURSION_LIMIT+") v="+RECURSION_LIMIT)
  
      //Fill across row
      code.push("for(i=shape[d]; i>=v; i-=v){")
        code.push("STACK[sp]=d|0")
        code.push("STACK[sp+1]=v|0")
        for(var i=0; i<nargs; ++i) {
          code.push("STACK[sp+"+(i+2)+"]=ptr"+i+"|0")
          code.push("ptr"+i+"+=(v*stride"+i+"[d])|0")
        }
        code.push("sp+="+frame_size)
      code.push("}")
  
      //Handle edge case
      code.push("if(i>0){")
        code.push("STACK[sp]=d|0")
        code.push("STACK[sp+1]=i|0")
        for(var i=0; i<nargs; ++i) {
          code.push("STACK[sp+"+(i+2)+"]=ptr"+i+"|0")
        }
        code.push("sp+="+frame_size)
      code.push("}")
    code.push("}")
 code.push("}")
 return code.join("\n")
}

function generateCode(orders, parsed) {
  console.log("Generating code for ", orders)
  var stripped = parsed.source
    , order = majorOrder(orders)
    , dimension = orders[0].length
    , nargs = orders.length
    , code = ['"use strict"']
    , matched, i, j
    , arglist = [ "STACK", "shape" ]
  //Create procedure arguments
  for(i = 0; i<nargs; ++i) {
    arglist.push("arr" + i)
    arglist.push("ptr" + i)
    arglist.push("stride" + i)
    code.push("ptr"+i+"=ptr"+i+"|0")
  }
  for(i = 0; i<parsed.scalar_args.length; ++i) {
    arglist.push("scalar"+i)
  }
  //Compute number of matching orders
  matched = 0;
matched_loop:
  while(matched < dimension) {
    for(j=1; j<nargs; ++j) {
      if(orders[j][matched] !== orders[0][matched]) {
        break matched_loop;
      }
    }
    ++matched;
  }
  //Generate code
  if(matched === dimension) {
    code.push(innerFill(dimension, nargs, order, stripped))
  } else {
    code.push(outerFill(matched, dimension, nargs, order , stripped))
  }
  arglist.push(code.join("\n"))
  console.log(arglist[arglist.length-1])
  return Function.apply(null, arglist)
}


function createShim(parsed) {
  var memoized = {}
  console.log("Creating shim")
  function executeCWise() {
    var proc_arg_count, proc_args, proc_arg_ptr, proc_name, proc
      , frame_size, stack_depth, stack_size
      , shape, orders
      , arr, a_shape, i, j
    if(arguments.length !== parsed.array_args.length + parsed.scalar_args.length) {
      throw new Error("Invalid arguments")
    }
    
    //Check shape
    shape = arguments[parsed.array_args[0]].shape
    if(shape.length === 0) {
      return
    }
    
    //Create argument structure to pass to procedure
    proc_arg_count = 2 + 3 * parsed.array_args.length + parsed.scalar_args.length
    proc_arg_ptr = 0
    proc_args = new Array(proc_arg_count)
    proc_args[proc_arg_ptr++] = STACK
    proc_args[proc_arg_ptr++] = shape.slice(0)
    
    //Allocate order array
    orders = new Array(parsed.array_args.length)
    
    //Parse array arguments
    for(i=0; i<parsed.array_args.length; ++i) {
      arr = arguments[parsed.array_args[i]]
      if(!arr.shape ||
         !arr.data ||
         !arr.stride ||
         typeof(arr.offset) !== "number") {
        throw new Error("Invalid array argument")
      }
      if(i > 0) {
        a_shape = arr.shape
        if(shape.length !== a_shape.length) {
          throw new Error("Shape mismatch")
        }
        for(j=0; j<shape.length; ++j) {
          if(shape[j] !== a_shape[j]) {
            throw new Error("Shape mismatch")
          }
        }
      }
      //Push arguments
      proc_args[proc_arg_ptr++] = arr.data
      proc_args[proc_arg_ptr++] = arr.offset
      proc_args[proc_arg_ptr++] = arr.stride
      //Compute order
      orders[i] = getOrder(arr.stride)
    }
    //Parse scalar arguments
    for(i=0; i<parsed.scalar_args.length; ++i) {
      proc_args[proc_arg_ptr++] = arguments[parsed.scalar_args[i]]
    }
    //Check stack size
    frame_size = parsed.array_args.length + 2
    stack_depth = 1 + shape.length * 27
    stack_size = frame_size * stack_depth
    if(STACK.length < stack_size) {
      STACK = new Int32Array(stack_size)
    }
    //Check for memoized procedure, rebuild if not present
    proc_name = orders.join('|')
    proc = memoized[proc_name]
    if(!proc) {
      proc = generateCode(orders, parsed)
      memoized[proc_name] = proc;
    }
    //Call procedure
    console.log(proc_args[1], proc_args[3], proc_args[4], proc_args[6], proc_args[7])
    proc.apply(null, proc_args)
  }
  return executeCWise
}


function compile(func, scalars) {
  var parsed = stripFunction(func, scalars || [])
  console.log(parsed)
  if(parsed.array_args.length === 0) {
    throw new Error("Error compiling expression, no array arguments!")
  }
  return createShim(parsed)
}


module.exports = compile
