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
var addeq = cwise("array", "array")
  .body(function(a, b) {
    a += b
  })
  .compile()

//Create two 2D arrays
var X = ndarray.zeros([128,128])
var Y = ndarray.zeros([128,128])

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

Examples
========
Here are a few recipes showing how to use cwise to implement some common operations to get you started:

### Multiply an array with a scalar
```javascript
var muls = cwise("array", "scalar")
  .body(function(a, s) {
    a *= s
  })
  .compile()

//Example usage:
muls(array, 2.0)
```

### Initialize an array with a grid with the first index
```javascript
var mgrid = cwise("index", "array")
  .body(function(i, a) {
    a = i[0]
  })
  .compile()

//Example usage:
var X = mgrid(ndarray.zeros([128]))
```

### Check if any element is set
```javascript
var any = cwise("array")
  .begin(function(a) {
    if(a) {
      return true
    }
  })
  .end(function() {
    return false
  })
  .compile()

//Usage
if(any(array)) {
  // ...
}
```

### Apply a stencil to an array
```javascript
var lap_op = cwise("array", "array", "array", "array", "array", "array")
  .body(function(a, c, n, s, e, w) {
    a = 0.25 * (n + s + e + w) - c
  })
  .compile()

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
var sum = cwise("array")
  .begin(function() {
    this.sum = 0
  })
  .body(function(a) {
    this.sum += a
  })
  .end(function() {
    return this.sum
  })
  .compile()
  
//Usage:
s = sum(array)
```
Note that variables stored in `this` are common to all the blocks


### Compute the index of the maximum element of an array:
```javascript
var argmin = cwise("index", "array")
  .begin(function(index) {
    this.min_v = Number.POSITIVE_INFINITY
    this.min_index = index.slice(0)
  })
  .body(function(index, a) {
    if(a < this.min_v) {
      this.min_v = a
      for(var i=0; i<index.length; ++i) {
        this.min_index[i] = index[i]
      }
    }
  })
  .end(function() {
    return this.min_index
  })
  .compile()

//Usage:
argmin(X)
```

FAQ
===

Is it fast?
-----------
Yes. [Citation needed]

How does it work?
-----------------
You can think of cwise as a type of macro language on top of JavaScript.  Internally, cwise uses node-falafel to parse the functions you give it and sanitize their arguments.  At run time, code for each array operation is generated lazily depending on the ordering and stride of the input arrays so that you get optimal cache performance.  These compiled functions are then memoized for future calls to the same function.  As a result, you should reuse array operations as much as possible to avoid wasting time and memory regenerating common functions.

Credits
=======
(c) 2013 Mikola Lysenko.  BSD License
