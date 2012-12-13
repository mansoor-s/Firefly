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



/**
* Handles application state. This is the default state manager; It will not persist, for multti-node setups,
* It is advisable to have an external persistence layer such as Redis handle multi-node state.
* This methods in th is object MUST be implemented in a service that is providing mulit-node state management
*
* @class State
* @module Core
* @constructor
*/
var State = module.exports = function() {
    this._state = {};
    
    Object.seal(this);
};


/**
* For a single node setup, this does nothing. Must be implemented in a service to handle multi-node application state
*
* @method persist
* @param {Function} callback function
*/
State.prototype.persist = function( fn ) {
    if ( fn instanceof Function ) {
        fn();
    }
    
};



/**
* For a single node setup, this does nothing. Must be implemented in a service to handle multi-node application state
*
* @method get
*/
State.prototype.get = function( name ) {
    return this._state[name];
};


/**
* For a single node setup, this does nothing. Must be implemented in a service to handle multi-node application state
*
* @method set
*/
State.prototype.set = function( name, value ) {
    return this._state[name] = value;
};


/**
* For a single node setup, this does nothing. Must be implemented in a service to handle multi-node application state
*
* @method update
*/
State.prototype.update = function( fn ) {
    if ( fn instanceof Function ) {
        fn();
    }
};