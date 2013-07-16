cwise
=====
This library can be used to generate cache efficient map/reduce operations for [ndarrays](http://github.com/mikolalysenko/ndarray).

Usage
=====
First, install using npm:

    npm install cwise
    
Then you can create an ndarray operation as follows:

```javascript
//Import libraries
var cwise = require("cwise")
  , ndarray = require("ndarray")

//Create operation
var addeq = cwise({
    args: ["array", "array"],
    body: function(a, b) {
      a += b
    }
  })

//Create two 2D arrays
var X = ndarray(new Float32Array(128*128), [128,128])
var Y = ndarray(new Float32Array(128*128), [128,128])

//Add them together
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


`require("cwise")(user_args)`
-----------------------------
To use the library, you pass it an object with the following fields:

* `args`: (Required) An array describing the type of the arguments passed to the body.  These may be one of the following:
    + `"array"`: An `ndarray`-type argument
    + `"scalar"`: A globally broadcasted scalar argument
    + `"index"`: (Hidden) An array representing the current index of the element being processed.  Initially [0,0,...] in the pre block and set to some undefined value in the post block.
    + `"shape"`: (Hidden) An array representing the shape of the arrays being processed
* `pre`: A function to be executed before starting the loop
* `body`: (Required) A function that gets applied to each element of the input arrays
* `post`: Executed when loop completes
* `printCode`: If this flag is set, then log all generated code
* `blockSize`: The size of a block (default 32)
* `funcName`: The name to give to the generated procedure for debugging/profiling purposes.  (Default is `body.name||"cwise"`)

The result is a procedure that you can call which executes these methods along the following lines:

```javascript
function(a0, a1, ...) {
  pre()
  for(var i=0; i<a0.shape[0]; ++i) {
    for(var j=0; j<a0.shape[1]; ++j) {
      ...
      
          body(a0[i,j,...], a1[i,j,...], ... )
    }
  }
  post()
}
```

### Notes
* To pass variables between the pre/body/post, use `this.*`
* The order in which variables get visited depends on the stride ordering if the input arrays.  In general it is not safe to assume that elements get visited (co)lexicographically.
* If no return statement is specified, the first ndarray argument is returned
* All input arrays must have the same shape.  If not, then the library will throw an error

Examples
========
Here are a few recipes showing how to use cwise to implement some common operations to get you started:

### Multiply an array with a scalar
```javascript
var muls = cwise({
  args: ["array", "scalar"],
  body: function(a, s) {
    a *= s
  }
})

//Example usage:
muls(array, 2.0)
```

### Initialize an array with a grid with the first index
```javascript
var mgrid = cwise({
  args: ["index", "array"],
  body: function(i, a) {
    a = i[0]
  }
})

//Example usage:
var X = mgrid(ndarray(new Float32Array(128)))
```

### Check if any element is set
```javascript
var any = cwise({
  args: ["array"],
  body: function(a) {
    if(a) {
      return true
    }
  },
  post: function() {
    return false
  }
})

//Usage
if(any(array)) {
  // ...
}
```

### Apply a stencil to an array
```javascript
var lap_op = cwise({
  args: ["array", "array", "array", "array", "array", "array"],
  body: function(a, c, n, s, e, w) {
    a = 0.25 * (n + s + e + w) - c
  }
})

function laplacian(dest, src) {
  lap_op(dest.hi(dest.shape[0]-1,dest.shape[1]-1).lo(1,1)
      , src.hi(src.shape[0]-1,src.shape[0]-1).lo(1,1)
      , src.hi(src.shape[0]-1,src.shape[0]).lo(1,0)
      , src.hi(src.shape[0]-1,src.shape[0]-2).lo(1,2)
      , src.hi(src.shape[0]-2,src.shape[0]-1).lo(0,1)
      , src.hi(src.shape[0],src.shape[0]-1).lo(2,1))
}

//Usage:
laplacian(next, prev)
```

### Compute the sum of all the elements in an array
```javascript
var sum = cwise({
  args: ["array"],
  pre: function() {
    this.sum = 0
  },
  body: function(a) {
    this.sum += a
  },
  post: function() {
    return this.sum
  }
})
  
//Usage:
s = sum(array)
```
Note that variables stored in `this` are common to all the blocks


### Compute the index of the maximum element of an array:
```javascript
var argmin = cwise({
  args: ["index", "array"],
  pre: function(index) {
    this.min_v = Number.POSITIVE_INFINITY
    this.min_index = index.slice(0)
  },
  body: function(index, a) {
    if(a < this.min_v) {
      this.min_v = a
      for(var i=0; i<index.length; ++i) {
        this.min_index[i] = index[i]
      }
    }
  },
  post: function() {
    return this.min_index
  }
})

//Usage:
argmin(X)
```

FAQ
===

Is it fast?
-----------
[Yes](https://github.com/mikolalysenko/ndarray-experiments)

How does it work?
-----------------
You can think of cwise as a type of macro language on top of JavaScript.  Internally, cwise uses node-falafel to parse the functions you give it and sanitize their arguments.  At run time, code for each array operation is generated lazily depending on the ordering and stride of the input arrays so that you get optimal cache performance.  These compiled functions are then memoized for future calls to the same function.  As a result, you should reuse array operations as much as possible to avoid wasting time and memory regenerating common functions.

Credits
=======
(c) 2013 Mikola Lysenko. MIT License
