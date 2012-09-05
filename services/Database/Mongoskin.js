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

var mongoskin = require('mongoskin');


/**
* Initialize Mongoskin and set it as a service named 'Mongoskin' with Firefly
*
* @class Mongoose
* @module Services
* @constructor
* @param {Object} firefly reference to Firefly instance
* @param {Object} opts mongodb connection options
* @param {String} [serviceName='Mongoose'] name for the service
*/
var Mongoskin = module.exports = function(firefly, opts, serviceName) {
    if (!firefly || !opts) {
        throw Error('`Mongoskin` service requires Firefly instance and configuration options as parameters in constructor');
    }

    this.app = firefly;
    this.opts = opts;

    this.db = mongoose.createConnection();

    this.app.set(serviceName || 'Mongoose', this.db);  

    this.app.addInitDependency(this._onInit());
};



/**
* The function returned by this method gets called on application init
*
* @method _onInit
* @private
* @return {Function} will return a callback function which itself takes a callback function
*/
Mongoose.prototype._onInit = function() {
    var self = this;
    return function(fn) {
        self.db.open(self.opts.HOST, self.opts.DB_NAME, self.opts.PORT, self.opts.OPTS, function() {
            console.log('Connected to MongoDB');

            //initialize models
            //self._initModels(fn);
        });
    };
};