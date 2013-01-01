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

var fs = require( 'fs' );


/**
* RenderManager object constructor.
*
* @class RenderManager
* @module Core
* @constructor
* @param {Object} app reference to Firefly object
*/
var RenderManager = module.exports = function( app, viewEngine ) {
    this._app = app;
    this._viewEngine = viewEngine;
    this._views = [];
    
    Object.seal(this);
};


/**
* Creates a map of view names and view file path. [Performes sync IO]
*
* @method buildViewMap
* @param {Function} fn callback
*/
RenderManager.prototype.buildViewMap = function( fn ) {
    var rawApplets = this._app.getAllRawApplets();
    
    var appletNames = Object.keys( rawApplets );
    
    for ( var i = 0, len = appletNames.length; i < len; ++i ) {
        var name = appletNames[ i ];
        var applet = rawApplets[ name ];
        applet.views = {};
        //skip loaidng applet views if the view folder does not exist
        if ( !fs.existsSync( applet.appletViewDir ) ) {
            continue;
        }
        
        var viewFiles = fs.readdirSync( applet.appletViewDir );
        for (var j = 0, jlen = viewFiles.length; j < jlen; ++j ) {
            applet.views[ viewFiles[ j ] ] = applet.appletViewDir + viewFiles[ j ];
            this._views.push(applet.views[ viewFiles[ j ] ]);
        }
    }
    if ( this._viewEngine ) {
        this._viewEngine.setViews( this._views, fn );
    } else {
        fn();
    }
    
};



/**
* Get the rendered contents of a view with the given properties
*
* @method render
* @param {String} applet Name of the raw applet to which the view belongs
* @param {String} viewName Name of the view
* @param {Object} props Object to pass to pass to view engine for the current view
* @param {Function} callback function that takes the rendered content as first parameter
* @returns {String} Rendered contents of the view
*/
RenderManager.prototype.render = function( applet, viewName, props, fn ) {
    var rawApplets = this._app.getAllRawApplets();
    
    var path = rawApplets[ applet.__protoAppletName ].views[ viewName ];
    
    if ( !path ) {
        throw new Error('View `' + viewName + '` does not exist for an instance of `' + applet.__protoAppletName + '` applet!');
    }

    if ( props === undefined ) {
        props = {};
    }
    
    return this._viewEngine.render( path, props, fn );
};



RenderManager.prototype.setViewEngine = function(engine) {
    this._viewEngine = engine;
};