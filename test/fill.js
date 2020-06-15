var cwise = require("cwise")
var ndarray = require("ndarray")

if(typeof test === "undefined") {
  test = require("tape")
}

test("fill", function(t) {

  var fill = cwise({
    args: ["index", "array", "scalar"],
    body: function(idx, out, f) {
      out = f.apply(null, idx)
    }
  })

  var xlen = 10
  var ylen = 5
  var array = ndarray(new Float32Array(xlen * ylen), [xlen, ylen])

  fill(array, function(row, col) {
    return 0
  })

  for(var i = 0; i < xlen; i++) {
    for(var j = 0; j < ylen; j++) {
      t.equals(array.get(i, j), 0, 'fill ('+ i + ',' + j + ')')
    }
  }

  fill(array, function(row, col) {
    return 10 * (row + col)
  })

  for(var i = 0; i < xlen; i++) {
    for(var j = 0; j < ylen; j++) {
      t.equals(array.get(i, j), 10 * (i + j), 'fill ('+ i + ',' + j + ')')
    }
  }

  t.end()
})
