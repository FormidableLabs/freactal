/* global __dirname */

Error.stackTraceLimit = Infinity;

const fs = require("fs");
const path = require("path");
const { jsdom } = require("jsdom");

require("babel-core/register");

const chai = require("chai");
const sinonChai = require("sinon-chai");
const chaiEnzyme = require("chai-enzyme");
global.sinon = require("sinon");

chai.config.includeStack = true;
chai.use(sinonChai);
chai.use(chaiEnzyme());

global.expect = chai.expect;
global.AssertionError = chai.AssertionError;
global.Assertion = chai.Assertion;
global.assert = chai.assert;

beforeEach(() => {
  global.sandbox = sinon.sandbox.create();
});

afterEach(() => {
  global.sandbox.restore();
  delete global.sandbox;
});

const document = global.document = jsdom("");
global.window = document.defaultView;
Object.keys(document.defaultView).forEach((property) => {
  if (typeof global[property] === "undefined") {
    global[property] = document.defaultView[property];
  }
});

global.navigator = { userAgent: "node.js" };

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
