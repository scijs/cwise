"use strict"

var uniq = require("uniq")

function innerFill(order, proc, body) {
  var dimension = order.length
    , nargs = proc.arrayArgs.length
    , has_index = proc.indexArgs.length>0
    , code = []
    , idx=0, pidx=0, i, j
  for(i=0; i<dimension; ++i) {
    code.push(["var i",i,"=0"].join(""))
  }
  //Compute scan deltas
  for(j=0; j<nargs; ++j) {
    for(i=0; i<dimension; ++i) {
      pidx = idx
      idx = order[i]
      if(i === 0) {
        code.push(["var d",j,"s",i,"=stride",j,"s",idx,"|0"].join(""))
      } else {
        code.push(["var d",j,"s",i,"=(stride",j,"s",idx,"-shape",pidx,"*stride",j,"s",pidx,")|0"].join(""))
      }
    }
  }
  //Scan loop
  for(i=dimension-1; i>=0; --i) {
    idx = order[i]
    code.push(["for(i",i,"=shape",idx,"|0;--i",i,">=0;){"].join(""))
  }
  //Push body of inner loop
  code.push(body)
  //Advance scan pointers
  for(i=0; i<dimension; ++i) {
    pidx = idx
    idx = order[i]
    for(j=0; j<nargs; ++j) {
      code.push(["ptr",j,"+=d",j,"s",i].join(""))
    }
    if(has_index) {
      if(i > 0) {
        code.push(["index[",pidx,"]-=shape",pidx].join(""))
      }
      code.push(["++index[",idx,"]"].join(""))
    }
    code.push("}")
  }
  return code.join("\n")
}

function outerFill(matched, order, proc, body) {
  var dimension = order.length
    , nargs = proc.arrayArgs.length
    , blockSize = proc.blockSize
    , has_index = proc.indexArgs.length > 0
    , code = []
  for(var i=0; i<nargs; ++i) {
    code.push(["var offset",i,"=ptr",i].join(""))
  }
  //Generate matched loops
  for(var i=matched; i<dimension; ++i) {
    code.push(["for(var j"+i+"=shape[", order[i], "]|0;j", i, ">0;){"].join(""))
    code.push(["if(j",i,"<",blockSize,"){"].join(""))
    code.push(["shape",order[i],"=j",i].join(""))
    code.push(["j",i,"=0"].join(""))
    code.push(["}else{shape",order[i],"=",blockSize].join(""))
    code.push(["j",i,"-=",blockSize,"}"].join(""))
    if(has_index) {
      code.push(["index[",order[i],"]=j",i].join(""))
    }
  }
  for(var i=0; i<nargs; ++i) {
    var indexStr = ["offset"+i]
    for(var j=matched; j<dimension; ++j) {
      indexStr.push(["j",j,"*stride",i,"s",order[j]].join(""))
    }
    code.push(["ptr",i,"=(",indexStr.join("+"),")|0"].join(""))
  }
  code.push(innerFill(order, proc, body))
  for(var i=matched; i<dimension; ++i) {
    code.push("}")
  }
  return code.join("\n")
}

//Count the number of compatible inner orders
function countMatches(orders) {
  var matched = 0, dimension = orders[0].length
  while(matched < dimension) {
    for(var j=1; j<orders.length; ++j) {
      if(orders[j][matched] !== orders[0][matched]) {
        return matched
      }
    }
    ++matched
  }
  return matched
}

//Processes a block according to the given data types
function processBlock(block, proc, dtypes) {
  var code = block.body
  var pre = []
  var post = []
  for(var i=0; i<block.args.length; ++i) {
    var carg = block.args[i]
    if(carg.count <= 0) {
      continue
    }
    var re = new RegExp(carg.name, "g")
    switch(proc.argTypes[i]) {
      case "array":
        var arrNum = proc.arrayArgs.indexOf(i)
        if(carg.count === 1) {
          if(dtypes[arrNum] === "generic") {
            if(carg.lvalue) {
              pre.push(["var local", arrNum, "=arr", arrNum, ".get(ptr", arrNum, ")"].join(""))
              code = code.replace(re, "local"+arrNum)
              post.push(["arr", arrNum, ".set(ptr", arrNum, ",local",arrNum,")"].join(""))
            } else {
              code = code.replace(re, ["arr", arrNum, ".get(ptr", arrNum, ")"].join(""))
            }
          } else {
            code = code.replace(re, ["arr", arrNum, "[ptr", arrNum, "]"].join(""))
          }
        } else if(dtypes[arrNum] === "generic") {
          pre.push(["var local", arrNum, "=arr", arrNum, ".get(ptr", arrNum, ")"].join(""))
          code = code.replace(re, "local"+arrNum)
          if(carg.lvalue) {
            post.push(["arr", arrNum, ".set(ptr", arrNum, ",local",arrNum,")"].join(""))
          }
        } else {
          pre.push(["var local", arrNum, "=arr", arrNum, "[ptr", arrNum, "]"].join(""))
          code = code.replace(re, "local"+arrNum)
          if(carg.lvalue) {
            post.push(["arr", arrNum, "[ptr", arrNum, "]=local",arrNum].join(""))
          }
        }
      break
      case "scalar":
        code = code.replace(re, "scalar" + proc.scalarArgs.indexOf(i))
      break
      case "index":
        code = code.replace(re, "index")
      break
      case "shape":
        code = code.replace(re, "inline_shape")
      break
    }
  }
  return [pre.join("\n"), code, post.join("\n")].join("\n")
}

//Generates a cwise operator
function generateCWiseOp(proc, typesig) {

  //Compute dimension
  var dimension = typesig[1].length|0
  var orders = new Array(proc.arrayArgs.length)
  var dtypes = new Array(proc.arrayArgs.length)

  //First create arguments for procedure
  var arglist = ["shape"]
  var code = ["'use strict'"]
  for(var j=0; j<dimension; ++j) {
    code.push(["var shape", j, "=shape[", j, "]|0"].join(""))
  }
  for(var i=0; i<proc.arrayArgs.length; ++i) {
    arglist.push("arr" + i)
    arglist.push("stride" + i)
    arglist.push("ptr" + i)
    code.push("ptr"+i+"|=0")
    for(var j=0; j<dimension; ++j) {
      code.push(["var stride",i,"s",j,"=stride",i,"[",j,"]|0"].join(""))
    }
    dtypes[i] = typesig[2*i]
    orders[i] = typesig[2*i+1]
  }
  for(var i=0; i<proc.scalarArgs.length; ++i) {
    arglist.push("scalar" + i)
  }
  if(proc.shapeArgs.length > 0) {
    code.push("var inline_shape=shape.slice(0)")
  }
  if(proc.indexArgs.length > 0) {
    var zeros = new Array(dimension)
    for(var i=0; i<dimension; ++i) {
      zeros[i] = "0"
    }
    code.push(["var index=[", zeros.join(","), "]"].join(""))
  }

  //Prepare this variables
  var thisVars = uniq([].concat(proc.pre.thisVars)
                      .concat(proc.body.thisVars)
                      .concat(proc.post.thisVars))
  if(thisVars.length > 0) {
    code.push("var " + thisVars.join(","))
  }
  
  //Inline prelude
  code.push(processBlock(proc.pre, proc, dtypes))

  //Process body
  var body = processBlock(proc.body, proc, dtypes)
  var matched = countMatches(orders)
  if(matched < dimension) {
    code.push(outerFill(matched, orders[0], proc, body))
  } else {
    code.push(innerFill(orders[0], proc, body))
  }

  //Inline epilog
  code.push(processBlock(proc.post, proc, dtypes))
  
  if(proc.debug) {
    console.log("Generated cwise routine for ", typesig, ":\n\n", code.join("\n"))
  }
  
  arglist.push(code.join("\n"))
  
  //Compile function and return
  return Function.apply(undefined, arglist)
}
module.exports = generateCWiseOp