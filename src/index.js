import buildEditor from './editor';
//import parse from './parse';
import {parse, parseContext} from "./parse";

var c = buildEditor();


window.loadState = c['loadState'];
window.saveState = c['saveState'];
window.resetGraph = c['resetGraph'];
window.parseButton = function() {
  var cy = c['cy'];
  //return parse(cy.$('node:selected'));
  return parseContext(cy.$('node:orphan'));
};
