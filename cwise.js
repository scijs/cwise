"use strict"

var transform = require("./lib/cwise-transform.js")
var base = require("./browser.js")

module.exports = function(a, b) {
  console.log("CALLING CWISE")
  if(typeof a === "string") {
    return transform(a, b)
  } else if(typeof a === "object") {
    return base(a)
  } else {
    throw new Error("cwise: Invalid arguments")
  }
}