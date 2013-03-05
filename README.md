cwise
=====
This library can be used to generate cache efficient map/reduce operations for [ndarrays](http://github.com/mikolalysenko/ndarray).  It is a fundamental building block for other higher order array processing tools.

Usage
=====
First, install using npm:

    npm install cwise
    
Then you can create an ndarray operation as follows:

```javascript
//First create the addition function
var addeq = require("cwise")(function(a,b) { a += b })

//Then create two arrays and add them together
var X = require("ndarray").zeros([128,128])
var Y = require("ndarray").zeros([128,128])
addeq(X, Y)
```

Formally, you can think of `addeq(X,Y)` as being something like the following for-loop, except optimized with respect to the dimension and order of X and Y:

```javascript
for(var i=0; i<X.shape[0]; ++i) {
  for(var j=0; j<X.shape[1]; ++j) {
    X.set(i,j, X.get(i,j) + Y.get(i,j))
  }
}
```

`require("cwise")(func[, options])`
-----------------------------------
Creates a component-wise n-ary map/reduce function.

* `func` is the body of the function, the arguments of which correspond to the different arrays the function acts on.
* `options` is an optional object with any of the following fields:
    * `scalars` an array of indices into the arguments of `func` describing arguments to wrap as broadcasted scalars over the iteration
    * `index` if set, maps the index of the current array element to a given variable
    * `pre` a function which is evaluated before the loop starts
    * `post` a function evaluated after the loop completes

Returns a function implementing the component-wise operation

Examples
========
Here are a few recipes showing how to use cwise to implement some common operations to get you started:

### Multiply an array with a scalar
```javascript
var muls = function("cwise")(function(a, s) {
    a *= s
  }, { scalars: [1] })
  
//Usage:
muls(array, 2.0)
```

### Initialize an array with a grid with the first index
```javascript
var mgrid = function("cwise")(function(index, a) {
  a = index[0]
}, { index: 0 })

//Usage:
var X = mgrid(ndarray.zeros([128]))
```

### Apply a stencil to an array
```javascript
var lap_op = require("cwise")(function(a,c,n0,n1,n2,n3) {
  a = 0.25 * (n0 + n1 + n2 + n3) - c
})

function laplacian(dest, src) {
  lap_op(dest.hi(dest.shape[0]-1,dest.shape[1]-1).lo(1,1)
      , src.hi(src.shape[0]-1,src.shape[0]-1).lo(1,1)
      , src.hi(src.shape[0]-2,src.shape[0]-1).lo(0,1)
      , src.hi(src.shape[0],src.shape[0]-1).lo(2,1)
      , src.hi(src.shape[0]-1,src.shape[0]-2).lo(1,2)
      , src.hi(src.shape[0]-1,src.shape[0]).lo(1,0))
}

//Usage:
laplacian(next, prev)
```

### Compute the sum of all the elements in an array
```javascript
var ndsum = require("cwise")(Function("a", "sum += a"), {
    pre: Function("var sum=0")
    post: Function("return sum")
  })
  
//Usage:
s = ndsum(array)
```
Note that `Function` objects are used instead of `function()` literals, since it is possible for minifiers to rename the variable `sum`

### Compute the index of the maximum element of an array:
```javascript
var argmin = require("cwise")(Function("index", "a", "if(a < min_a) { max_index=index.slice(0); min_a=a; }"), {
      index: 0,
      pre: Function("var min_index=index.slice(0), min_a=Number.NEGATIVE_INFINITY"),
      post: Function("return min_index")
    })

//Usage:
argmin(X)
```

How it Works
============
Internally cwise is built on top of node-falafel.  At run time, code for each array operation is generated lazily depending on the ordering and stride of the input arrays.  These functions are cached for future calls to the same function.  As a result, you should reuse array operations as much as possible.

Credits
=======
(c) 2013 Mikola Lysenko.  BSD License
