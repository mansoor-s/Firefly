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


/*
    SessionManager

        Redis session manager for Firefly
*/
var SessionManager = module.exports = function(app) {
    this._cookieName = app.config.SESSION_COOKIE_NAME;
    app.addInitDependency(this._onInit());
    
    this._client = redis.createClient();
};



/*
    (TODO: change the redis database from the default 0 in accordance with the config file)
 
*/
SessionManager.prototype._onInit = function() {
    return function(fn) {
        fn();
    };    
};



/*
    Function: getSession

        Get session object for given session ID

    Parameters:

        request - {String} reference to Request object
        fn - {Function} callback function taking the session object as the parameter
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



/*
    Function: createSession

        Create a session and return its session ID
    
    Parameters:

        response - {Object} reference to the response object
        data - {Object} object containing data to save for the session. `data` CAN be undefined
        fn - {Function} callback
*/
SessionManager.prototype.createSession = function(response, data, fn) {
    var id = uuid.v4(); 
    
    data = data || {};

    response.setCookie({name: this._cookieName, value: id});
    
    this._client.set(id, data, function(err, res) {
        if(err) {
            throw Error(err);
        }
        
        fn(id);
    });
};



/*
    Function: destorySession

        Destroy session with the given session ID

    Parameters: 

        request - {Object} reference to the request object
        response - {Object} reference to the response object
        fn - {Function} callback

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