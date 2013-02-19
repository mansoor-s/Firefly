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

"use strict";

var fs = require( 'fs' ),
    path = require('path'),
    dive = require('dive');

var BaseModel = require( './BaseModel.js' ),
    BaseModelInstance = require( './BaseModelInstance.js' );

/**
* ModelManager object constructor.
*
* @class ModelManager
* @module Core
* @constructor
* @param {Object} app reference to Firefly object
*/
var ModelManager = module.exports = function( app ) {
    this._app = app;
    
    Object.seal(this);
};

/**
* Initialize models from schema directory
*
* @method _initModels
* @private
* @param {Function} fn callback
*/
ModelManager.prototype.initModels = function(fn) {
    var self = this;
    
    dive(this._app.config.MODELS_DIR, { all: true }, function(err, filePath) {
        if (err) {
            return;
        }
        
        var filePathParts = filePath.split(path.sep),
            len = filePathParts.length,
            fileName = filePathParts[len - 1],
            nameParts = fileName.split('.');

        if(nameParts.length === 1 ) {
            return;
        }

        var name = nameParts[0],
            ext = nameParts[1];

        if (ext !== 'js') {
            return;
        }

        var schema = require(filePath);
        
        console.log(name);
        console.log(schema);
        
        self.processSchema(name, schema);
    }, fn);
    
    fn();
};


ModelManager.prototype.processSchema = function(name, schema) {
    var base = function() {};
    
    
};