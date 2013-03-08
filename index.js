"use strict"

var compile = require("./lib/compile.js")

function Builder(args) {
  this._args = args
  this._pre = null
  this._body = null
  this._post = null
  this._options = {}
}

Builder.prototype.begin = function(func) {
  this._pre = func
  return this
}

Builder.prototype.body = function(func) {
  this._body = func
  return this
}

Builder.prototype.end = function(func) {
  this._post = func
  return this
}

Builder.prototype.compile = function(options) {
  this._options = options || {}
  return compile(this)
}

function makeBuilder() {
  return new Builder(Array.prototype.slice.call(arguments, 0))
}

module.exports = makeBuilder