var cwise = require("../index.js")

var moments = cwise({
  args: ["array"]
  , pre: function() {
    this.moments = [0,0,0]
    this.stuff = 0
  }
  , body: function(a) {
    this   .moments[0] += 1;
    this .moments[1] += a;
    this.moments[2] += a*a;
  }
  , post: function() {
    return this.moments
  }
})

var array = require("ndarray").zeros([128,128])

console.log(moments(array))