// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: loopback-example-ssl
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

var path = require('path');
var fs = require('fs');

exports.keyJcm = fs.readFileSync(path.join(__dirname, './private/jcm/ssl.key'), 'utf8').toString();
exports.certJcm = fs.readFileSync(path.join(__dirname, './private/jcm/ssl.crt'), 'utf8').toString();
exports.keyPh = fs.readFileSync(path.join(__dirname, './private/ph/ssl.key'), 'utf8').toString();
exports.certPh = fs.readFileSync(path.join(__dirname, './private/ph/ssl.crt'), 'utf8').toString();
 
exports.certPl = fs.readFileSync(path.join(__dirname, './private/pl/ssl.crt'), 'utf8').toString();
 
