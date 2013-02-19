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


/**
* BaseModelInstance object constructor.
*
* @class BaseModelInstance
* @module Core
* @constructor
* @param {Object} app reference to Firefly object
*/
var BaseModelInstance = module.exports = function() {
    this._id;
    Object.seal(this);
};



BaseModelInstance.prototype.save = function( fn ) {

};


BaseModelInstance.prototype.remove = function( fn ) {

};

BaseModelInstance.prototype.deepRemove = function( fn ) {

}


BaseModelInstance.prototype.update = function( obj, fn ) {

};


BaseModelInstance.prototype.reload = function( fn ) {

};