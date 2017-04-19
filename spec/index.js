/* global __dirname */

Error.stackTraceLimit = Infinity;

const fs = require("fs");
const path = require("path");

require("babel-core/register");

const chai = require("chai");
const sinonChai = require("sinon-chai");
global.sinon = require("sinon");

chai.config.includeStack = true;
chai.use(sinonChai);

global.expect = chai.expect;
global.AssertionError = chai.AssertionError;
global.Assertion = chai.Assertion;
global.assert = chai.assert;

const specFile = /\.spec\.js$/;
const recursiveRequire = (basepath, cb) => fs.readdirSync(basepath).forEach(filename => {
  const filepath = path.join(basepath, filename);
  if (fs.statSync(filepath).isDirectory()) {
    recursiveRequire(filepath, cb);
  } else if (specFile.test(filename)) {
    require(filepath);
  }
});

recursiveRequire(__dirname);
