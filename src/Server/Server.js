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

var http = require( 'http' );
var https = require( 'https' );

/*
   Function: Server

   Server object constructor

   Parameters:

      firefly - Refrence to the application Firefly object
      request_handler - Function to call for every client request. The parameters Request and Response are passed to the callback
*/
var Server = module.exports = function( firefly, requestHandler ) {
    this._serverInitialized = false;
    
    this._webServer = undefined;
    this._firefly = firefly;
    this._config = firefly.config;
    this._requestHandler = requestHandler;

    firefly.set('Server', this);
};



/*
   Function: setRequestHandler

   Set the request handler for the server if it is not passed with the object constructor

   Parameters:

      fn - Request handler function
*/
Server.prototype.setRequestHandler = function( fn ) {
    this._requestHandler = fn;
};



/*
   Function: start

   Start the server

   Parameters:

      fn - function to call when server has started

   See Also:

      <stop>
*/
Server.prototype.start = function( fn ) {
    if ( !this._server_initialized ) {
        var protocol = this._config.PROTOCOL.toLowerCase();
        if ( protocol === 'https' ) {
            this._webServer = https.createServer( { key: this._config.TLS_KEY, cert: this._config.TLS_CERT }, this._requestHandler );
            this._isSecure = true;
        } else {
            this._webServer = http.createServer( this._requestHandler );
            this._isSecure = false;
        }

        this._serverInitialized = true;
    }
    
    var serverManager = this._firefly.get( 'ServerManager' );
    if ( serverManager ) {
        serverManager.use( this._webServer, fn );
    } else {
        this._webServer.listen( this._config.PORT, this._config.HOST, fn );
    }
};



/*
   Function: stop

   Stop the server from accepting any new connections

   See Also:

      <start>
*/
Server.prototype.stop = function() {
    this._webServer.close();
};



/*
   Function: isSecure

   Returns a boolean value indicated whether or not the server is a secure one. i.e HTTPS or HTTP
*/
Server.prototype.isSecure = function() {
    return this._isSecure;
};

/*
   Function: getNativeServer
      Get a refrence to the native HTTP/HTTPS server object
   Returns:

        {Object} - Native server object
*/
Server.prototype.getNativeServer = function() {
    return this._webServer;
};