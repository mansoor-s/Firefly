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
/*
    Function: Cookie

        Cookie object constructor

    Parameters:

        properties - properties of the cookie object. ie {name: 'foo', value:'cookievalue123456798'}
*/
let Cookie = module.exports = function( properties ) {
    this._isSecure = false;
    this._name = '';
    this._value = '';
    
    for ( let prop in properties ) {
        this[ '_' + prop ] = properties[ prop ];
    }
};



/*
    Function: toString

        String representation of the cookie for setting in HTTP header

    Returns:

        {String} cookie name
*/
Cookie.prototype.toString = function() {
    let secureFlag = this._isSecure ? ' Secure;' : '';
    
    let expires = '';
    if ( this._expires !== undefined ) {
        expires = ' Expires=' + this._expires.toString() + ';';
    }
    
    let domain = this._domain ? ' ' + domain + ';' : '';
    
    let path = this._path ? ' ' + path + ';' : '';
    
    let string = this._name + '=' + this._value + ';';
    string += domain + path + expires + secureFlag;
    
    return string;
};



/*
    Function: getExpires

        Get the cookie's `Expires` directive. 

    Returns:

        {Date} cookie expires value as a Date object
*/
Cookie.prototype.getExpires = function() {
    return this._expires;
};



/*
    Function: setExpires

        Set the cookie's `Expires` directive. 

    Parameters:

        expires - {Date} value to set as the cookie's expires value
*/
Cookie.prototype.setExpires = function( expires ) {
    this._expires = expires;
};



/*
    Function: getName

        Returns the name of the Cookie

    Returns:

        {String} cookie name
*/
Cookie.prototype.getName = function() {
    return this._name;
};



/*
    Function: setName

        Set the cookie's name

    Parameters:

        name - {String} cookie name
*/
Cookie.prototype.setName = function( name ) {
    this._name = name;
};




/*
    Function: getValue

        Returns the cookie value

    Returns:

        {String} cookie value
*/
Cookie.prototype.getValue = function() {
    return this._value;
};



/*
    Function: setValue

        Set the cookie value

    Parameters:

        value - {String} the value to set
*/
Cookie.prototype.setValue = function( value ) {
    this._value = value;
};



/*
    Function: getDomain

        Returns the cookie's domain restriction

    Returns:

        {String} cookie domain
*/
Cookie.prototype.getDomain = function() {
    return this._domain;
};




/*
    Function: setDomain

        Set the cookie's domain restriction

    Parameters:

        domain - {String} cookie domain
*/
Cookie.prototype.setDomain = function( domain ) {
    this._domain = domain;
};




/*
    Function: getPath

        Returns the cookies path restriction

    Returns:

        {String} cookie path
*/
Cookie.prototype.getPath = function() {
    return this._path;
};



/*
    Function: setPath

        Set the cookie's path restriction

    Parameters:

        path - {String} cookie path
*/
Cookie.prototype.setPath = function( path ) {
    this._path = path;
};




/*
    Function: isSecure

        Determine if the `Secure` flag is set on the cookie

    Returns:

        {Boolean} Is cookie secure
*/
Cookie.prototype.isSecure = function() {
    return this._isSecure;
};




/*
    Function: isSecure

        Set a boolean value that will determine if the `Secure` flag is set on the cookie
            Defaults to false

    Parameters:

        isSecure - {Boolean} Is cookie secure
*/
Cookie.prototype.setSecure = function( isSecure ) {
    this._isSecure = isSecure;
};