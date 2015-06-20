"use strict"
var cwise = require("..")
  , ndarray = require("ndarray")
  , test = require("tape")

test("only allow same shape", function(t) {
  var op1 = cwise({
    args: ["array"],
    body: function(a) { a = 1 }
  })
  var op2 = cwise({
    args: ["array", "array"],
    body: function(a, b) { a = b }
  })
  var op3 = cwise({
    args: ["array", "array", "array"],
    body: function(a, b, c) { a = b + c }
  })
  var op2block_pos = cwise({
    args: ["array", {blockIndices: 1}],
    body: function(a, b) { a = b[1] }
  })
  var op2block_neg = cwise({
    args: ["array", {blockIndices: -1}],
    body: function(a, b) { a = b[1] }
  })
  
  t.doesNotThrow(function() { op1(ndarray([1,2,3],[3])) })
  t.doesNotThrow(function() { op2(ndarray([1,2,3],[3]), ndarray([1,2,3],[3])) })
  t.doesNotThrow(function() { op2(ndarray([1,2,3,4,5,6],[3,2]), ndarray([1,2,3,4,5,6],[3,2])) })
  t.doesNotThrow(function() { op3(ndarray([1,2,3],[3]), ndarray([1,2,3],[3]), ndarray([1,2,3],[3])) })
  t.doesNotThrow(function() { op2block_pos(ndarray([1,2],[2]), ndarray([1,2,3,4,5,6],[3,2])) })
  t.doesNotThrow(function() { op2block_neg(ndarray([1,2,3],[3]), ndarray([1,2,3,4,5,6],[3,2])) })

  t.throws(function() { op2(ndarray([1,2,3],[3]), ndarray([1,2],[2])) })
  t.throws(function() { op2(ndarray([1,2,3,4,5,6],[3,2]), ndarray([1,2,3],[3,1])) })
  t.throws(function() { op2(ndarray([1,2,3,4,5,6],[3,2]), ndarray([1,2,3,4],[2,2])) })
  t.throws(function() { op3(ndarray([1,2,3],[3]), ndarray([1,2,3],[3]), ndarray([1,2],[2])) })
  t.throws(function() { op3(ndarray([1,2,3],[3]), ndarray([1,2],[2]), ndarray([1,2,3],[3])) })
  t.throws(function() { op3(ndarray([1,2],[2]), ndarray([1,2,3],[3]), ndarray([1,2,3],[3])) })
  t.throws(function() { op2block_pos(ndarray([1,2,3],[3]), ndarray([1,2,3,4,5,6],[3,2])) })
  t.throws(function() { op2block_neg(ndarray([1,2],[2]), ndarray([1,2,3,4,5,6],[3,2])) })
  t.throws(function() { op2block_pos(ndarray([1,2,3,4,5,6],[3,2]), ndarray([1,2,3,4],[2,2])) })
  t.throws(function() { op2block_neg(ndarray([1,2,3,4,5,6],[3,2]), ndarray([1,2,3,4],[2,2])) })
  
  t.end()
})
