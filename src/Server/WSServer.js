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

let ws = require( 'ws' );


/*
    Function: WSServer

        WSServer object constructor

    Parameters:

        firefly - {Object} Refrence to application's Firefly object
        wsInfo - {Object} Object containing
        requestHandler - {Function} Fn to call for every client connect. Refrence
            to `socket` object is passed to the callback
*/
let WSServer = module.exports = function( firefly, wsInfo, requestHandler ) {
    this._wss = new ws.Server({
        'server': firefly.server.getNativeServer(),
        'path': wsInfo.path
    });
    
    this._wss.on('connection', function( ws ) {
        requestHandler( wsInfo, ws );
    });
};


/*
    Function: stop

    Close connection to all connected clients and shutdown WS server

    Parameters:

       code - {String} disconnect code
       data - {String} data to be passed to client
*/
WSServer.prototype.stop = function( code, data ) {
    this._wss.close( code, data );
};