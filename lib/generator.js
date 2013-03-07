"use strict"

var RECURSION_LIMIT = 32

function innerFill(order, procedure) {
  var dimension = order.length
    , nargs = procedure.numArrayArgs()
    , has_index = procedure.hasIndex()
    , code = []
    , idx, pidx, i, j
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
  //Push body of inner loop
  code.push(procedure.body)
  //Advance scan pointers
  for(i=0; i<dimension; ++i) {
    idx = order[i]
    for(j=0; j<nargs; ++j) {
      code.push("ptr"+j+"+=d"+j+"s"+i)
    }
    if(has_index) {
      if(i > 0) {
        pidx = order[i-1]
        code.push("index["+pidx+"]-=shape["+pidx+"]")
      }
      code.push("++index["+idx+"]")
    }
    code.push("}")
  }
  return code.join("\n")
}

function outerFill(matched, order, procedure) {
  var dimension = order.length
    , nargs = procedure.numArrayArgs()
    , has_index = procedure.hasIndex()
    , code = []
    , static_args = dimension
    , index_start = nargs + static_args
    , frame_size = index_start + (has_index ? dimension : 0)
    , i
  
  //Initiaize variables
  code.push("var i=0,l=0,v=0,d=0,sp=0")
  
  //Begin recursion
  code.push("while(true){")
    
    //Walk over runs to get bounds
    code.push("l="+RECURSION_LIMIT)
    code.push("v="+RECURSION_LIMIT)
    code.push("d="+matched)
  
    for(i=matched; i<dimension; ++i) {
      code.push("if(shape["+i+"]>l){")
        code.push("v=l|0")
        code.push("l=shape["+i+"]|0")
        code.push("d="+i+"|0")
      code.push("}else if(shape["+i+"]>v){")
        code.push("v=shape["+i+"]|0")
      code.push("}")
    }
  
    code.push("if(l<="+RECURSION_LIMIT+"){")
      code.push(innerFill(order, procedure))
    code.push("} else {")
  
      //Round v to previous power of 2
      code.push("v=(v>>>1)-1")
      code.push("for(i=1;i<=16;i<<=1){v|=v>>>i}")
      code.push("++v")
      code.push("if(v<"+RECURSION_LIMIT+") v="+RECURSION_LIMIT)
  
      //Set shape
      code.push("i=shape[d]")
      code.push("shape[d]=v")
  
      //Fill across row
      code.push("for(;i>=v;i-=v){")
        for(i=0; i<dimension; ++i) {
          code.push("STACK[sp+"+i+"]=shape["+i+"]")
        }
        for(i=0; i<nargs; ++i) {
          code.push("STACK[sp+"+(i+static_args)+"]=ptr"+i+"|0")
        }
        if(has_index) {
          for(i=0; i<dimension; ++i) {
            code.push("STACK[sp+"+(i+index_start)+"]=index["+i+"]")
          }
          code.push("index[d]+=v")
        }
        for(i=0; i<nargs; ++i) {
          code.push("ptr"+i+"+=(v*stride"+i+"[d])|0")
        }
        code.push("sp+="+frame_size)
      code.push("}")
  
      //Handle edge case
      code.push("if(i>0){")
        code.push("shape[d]=i")
        for(i=0; i<dimension; ++i) {
          code.push("STACK[sp+"+i+"]=shape["+i+"]")
        }
        for(i=0; i<nargs; ++i) {
          code.push("STACK[sp+"+(i+static_args)+"]=ptr"+i+"|0")
        }
        if(has_index) {
          for(i=0; i<dimension; ++i) {
            code.push("STACK[sp+"+(i+index_start)+"]=index["+i+"]")
          }
        }
        code.push("sp+="+frame_size)
      code.push("}")
    code.push("}")
  
    //Pop previous state
    code.push("if(sp<=0){")
      code.push("break")
    code.push("}")
    code.push("sp-="+frame_size)
    for(i=0; i<dimension; ++i) {
      code.push("shape["+i+"]=STACK[sp+"+i+"]")
    }
    for(i=0; i<nargs; ++i) {
      code.push("ptr"+i+"=STACK[sp+"+(i+static_args)+"]")
    }
    if(has_index) {
      for(i=0; i<dimension; ++i) {
        code.push("index["+i+"]=STACK[sp+"+(i+index_start)+"]")
      }
    }
 code.push("}")
 return code.join("\n")
}

function majorOrder(orders) {
  return orders[0]
}

function generate(orders, procedure) {
  var order = majorOrder(orders)
    , dimension = orders[0].length
    , nargs = procedure.numArrayArgs()
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
  for(i = 0; i<procedure.numScalarArgs(); ++i) {
    arglist.push("scalar"+i)
  }
  if(procedure.hasIndex()) {
    code.push("var index=[")
    for(i=0; i<dimension; ++i) {
      code.push((i > 0) ? ",0":"0")
    }
    code.push("]")
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
  if(procedure.pre) {
    code.push(procedure.pre)
  }
  if(matched === dimension) {
    code.push(innerFill(order, procedure))
  } else {
    code.push(outerFill(matched, order, procedure))
  }
  if(procedure.post) {
    code.push(procedure.post)
  } else {
    code.push("return arr0")
  }
  arglist.push(code.join("\n"))
  return Function.apply(null, arglist)
}

module.exports = generate