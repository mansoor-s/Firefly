/*
    Firefly - Node.js Framework
    Copyright (C) <2012>  <Mansoor Sayed>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

var winston = require('winston');

/**
* Logging for Firefly
*
* @class Logger
* @module Core
* @constructor
* @param {Object} firefly Reference to the application Firefly object
*/
var Logger = module.exports = function(firefly) {

    Object.seal(this);
};


/**
* Log information
*
* @method info
* @param {String} message Messaage to log
* @param {Object} [meta] Metadata object to include witht the log 
*/
Logger.prototype.info = function( message, meta ) {
    winston.info(message, meta);
};



/**
* Log warnings
*
* @method info
* @param {String} message Messaage to log
* @param {Object} [meta] Metadata object to include witht the log 
*/
Logger.prototype.warn = function( message, meta ) {
    winston.warn();
};



/**
* Log errors
*
* @method error
* @param {String} message Messaage to log
* @param {Object} [meta] Metadata object to include with the log 
*/
Logger.prototype.error = function( message, meta ) {
    winston.error(message, meta);
};


/**
* Log errors
*
* @method exception
* @param {String} message Messaage to log
* @param {Object} [meta] Metadata object to include with the log 
*/
Logger.prototype.exception = function( message ) {
    winston.error(message.stack);
};