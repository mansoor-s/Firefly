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
var redis = require('redis');
var uuid = require('node-uuid');


/**
* Redis based session manager for Firefly
*
* @class SessionManager
* @module Services
* @constructor
* @param {Object} firefly Reference to the application Firefly object
* @param {String} [serviceName='SessionManager'] Name with which to register the service with Firefly
*/
var SessionManager = module.exports = function(firefly, serviceName) {
    serviceName = serviceName || 'SessionManager';
    
    firefly.set(serviceName, this);
    
    this._cookieName = firefly.config.SESSION_COOKIE_NAME;
    
    //firefly.addInitDependency(this._onInit());
    
    this._client = redis.createClient();
    console.log('created redis client');
};



/**
* function to be called on application initialization. *Not* registered with firefly.
*   No use for it at this time (TODO: change the redis database from the default 0 in accordance with the config file)
*
* @method _onInit
* @private
*/
SessionManager.prototype._onInit = function() {
    return function(fn) {
        fn();
    };    
};



/**
* Get session object for given session ID
*
* @method getSession
* @param {String} request Reference to Request object
* @param {Function} fn Callback function taking the session object as the parameter
*/
SessionManager.prototype.getSession = function( request, fn ) {
    var sessionId = request.getCookie( this._cookieName );
    
    /*
        Do nothing if session ID wasn't found
    */
    if ( !sessionId ) {
        fn();
        return;
    }

    this._client.get(sessionId, function (err, session) {
        if(err) {
            throw Error(err);
        }
        
        fn(session);
    });
};



/**
* Create a session and return its session ID
*
* @method createSession
* @param {Object} response reference to the response object
* @param {Object} data Object containing data to save for the session. `data` CAN be undefined
* @param {Function} fn Callback function
*/
SessionManager.prototype.createSession = function(response, data, fn) {
    var id = uuid.v4(); 
    
    data = data || {};

    response.setCookie({name: this._cookieName, value: id});
    
    this._client.hset(id, data, function(err, res) {
        if(err) {
            throw Error(err);
        }
        
        fn(id);
    });
};



/**
* Destroy session with the given session ID
*
* @method destorySession
* @param {Object} response Reference to the response object
* @param {Object} response Reference to the response object
* @param {Function} fn Callback function
*/
SessionManager.prototype.destroySession = function(request, response, fn) {
    var sessionId = request.getCookie(this._cookieName);
    
    if ( !sessionId ) {
        fn();
        return;
    }

    response.removeCookie(this._cookieName);
    this._client.del(sessionId, function(err) {
        if(err) {
            throw Error(err);
        }
        fn();
    });
};