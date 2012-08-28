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

let Firefly = require( './src/Firefly/Firefly.js' );
let config = require( './Config.js' );
let routes = require( './Routes.js' );

let HandleBars = require( './services/Renderer/Handlebars.js' );
let SessionManager = require( './services/SessionManager.js' );

let Mongoose = require( './services/Database/Mongoose.js' );
let Authenticate = require( './services/Authenticate.js' );

//new instance of Firefly
let firefly = new Firefly( routes, config );

//Redis session store:
//let sessionManager = new SessionManager(firefly);
//firefly.set('SessionManager', sessionManager);

let mongoose = new Mongoose(firefly, config.MongoDB);

//Authentication service:
let authenticate = new Authenticate(firefly);
firefly.set('Authenticate', authenticate);

//set up renderer. wrapper for Handlebars
let handlebars = new HandleBars(firefly);
firefly.setViewEngine(handlebars);


//Initialize 
firefly.init(function() {
    //server initialized and awaiting requests  
    console.log('Server Started');  
});