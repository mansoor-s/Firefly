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

var r = require('rethinkdb');

/**
* RethinkDB object constructor.
*
* @class RethinkDB
* @module Core
* @constructor
* @param {Object} app reference to Firefly object
*/
var RethinkDB = module.exports = function( app ) {
    this._app = app;

    Object.seal(this);
};


RethinkDB.prototype.init = function() {
    r.connect({ host: this._app.config.DB_ENGINES.RethinkDB.host || 'localhost',
                port: this._app.config.DB_ENGINES.RethinkDB.port || 28015 }, function(conn) {
    }, function() {
        throw new Error('Connection to RethinkDB failed');
    });
};