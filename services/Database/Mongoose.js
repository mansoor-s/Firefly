/*
    Firefly - Node.js CMS
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


var fs = require('fs'),
    path = require('path'),
    mongoose = require('mongoose'),
    dive = require('dive');


/*
    Function: Mongoose
        Initialize Mongoose and set it as a service named 'Mongoose' with Firefly

    Parameters:

        firefly - {Object} reference to Firefly instance
        opts - {Object} mongodb connection options
        servicename - {String} (optional) name for the service. Defaults to `Mongoose` 

*/
var Mongoose = module.exports = function(firefly, opts, serviceName) {
    if (!firefly || !opts) {
        throw Error('`Mongoose` service requires Firefly instance and configuration options as parameters in constructor');
    }

    this.app = firefly;
    this.opts = opts;

    this.db = mongoose.createConnection();

    this.app.set(serviceName || 'Mongoose', this.db);  

    this.app.addInitDependency(this._onInit());
};


/*
    Function: _onInit

        Function gets called on application init

    parameters:

        fn - {Function} callback
*/
Mongoose.prototype._onInit = function() {
    var self = this;
    return function(fn) {
        self.db.open(self.opts.HOST, self.opts.DB_NAME, self.opts.PORT, self.opts.OPTS, function() {
            console.log('Connected to MongoDB');

            //initialize models
            self._initModels(fn);
        });
    };
};


/*
    Function: _initModels

        Initialize mongoose models from schema directory

    parameters:

        fn - {Function} callback
*/
Mongoose.prototype._initModels = function(fn) {
    var self = this;

    dive(this.opts.MODELS_DIR, { all: true }, function(err, filePath) {
        if (err) {
            throw err
        }
        
        var filePathParts = file.split(path.sep),
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
        self.db.model(name, schema);
    }, fn);
};