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


/**
* Cookie object constructor
*
* @class Cookie
* @module Core
* @constructor
* @param {Object} properties Properties of the cookie object. ie {name: 'foo', value:'cookievalue123456798'}
*/
var Cookie = module.exports = function( properties ) {
    this._isSecure = false;
    this._name = '';
    this._value = '';
    
    for ( var prop in properties ) {
        this[ '_' + prop ] = properties[ prop ];
    }
};



/**
* String representation of the cookie for setting in HTTP header
*
* @method toString
* @return {String} String representation of the cookie
*/
Cookie.prototype.toString = function() {
    var secureFlag = this._isSecure ? ' Secure;' : '';
    
    var expires = '';
    if ( this._expires !== undefined ) {
        expires = ' Expires=' + this._expires.toString() + ';';
    }
    
    var domain = this._domain ? ' ' + domain + ';' : '';
    
    var path = this._path ? ' ' + path + ';' : '';
    
    var string = this._name + '=' + this._value + ';';
    string += domain + path + expires + secureFlag;
    
    return string;
};



/**
* Get the cookie's `Expires` directive. 
*
* @method getExpires
* @return {Date} cookie expires value as a Date object
*/
Cookie.prototype.getExpires = function() {
    return this._expires;
};



/**
* Set the cookie's `Expires` directive.
*
* @method setExpires
* @param {Date} expires value to set as the cookie's expires value
*/
Cookie.prototype.setExpires = function( expires ) {
    this._expires = expires;
};



/**
* Returns the name of the Cookie
*
* @method getName
* @return {String} cookie name
*/
Cookie.prototype.getName = function() {
    return this._name;
};



/**
* Set the cookie's name
*
* @method setName
* @param {String} name cookie name
*/
Cookie.prototype.setName = function( name ) {
    this._name = name;
};




/**
* Returns the cookie value
*
* @method getValue
* @return {String} cookie value
*/
Cookie.prototype.getValue = function() {
    return this._value;
};



/**
* Set the cookie value
*
* @method setValue
* @param {String} value The value to set
*/
Cookie.prototype.setValue = function( value ) {
    this._value = value;
};



/**
* Returns the cookie's domain restriction
*
* @method getDomain
* @return {String} cookie domain
*/
Cookie.prototype.getDomain = function() {
    return this._domain;
};



/**
* Set the cookie's domain restriction
*
* @method setDomain
* @param {String} domain cookie domain
*/
Cookie.prototype.setDomain = function( domain ) {
    this._domain = domain;
};




/**
* Returns the cookies path restriction
*
* @method getPath
* @return {String} cookie path restriction
*/
Cookie.prototype.getPath = function() {
    return this._path;
};



/**
* Set the cookie's path restriction
*
* @method setPath
* @param {String} path cookie path
*/
Cookie.prototype.setPath = function( path ) {
    this._path = path;
};




/**
* Determine if the `Secure` flag is set on the cookie
*
* @method isSecure
* @return {Boolean} true if it is a secure cookie otherwise false
*/
Cookie.prototype.isSecure = function() {
    return this._isSecure;
};



/**
* Set a boolean value that will determine if the `Secure` flag is set on the cookie
            Defaults to false
*
* @method setSecure
* @param {Boolean} isSecure Is cookie secure
*/
Cookie.prototype.setSecure = function( isSecure ) {
    this._isSecure = isSecure;
};