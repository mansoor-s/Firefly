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

let fs = require( 'fs' );
let path = require( 'path' );

/*
    Function: RenderManager

        RenderManager object constructor.

    Parameters:

        app - {Object} Refrence to Firefly object
*/
let RenderManager = module.exports = function( app, viewEngine ) {
	this._app = app;
    this._viewEngine = viewEngine;
    this._views = [];
};


/*
    Function: buildViewMap

        Creates a map of view names and view file path. [Performes sync IO]

    Parameters: fn - {Function} callback
*/
RenderManager.prototype.buildViewMap = function( fn ) {
    let rawApplets = this._app.getAllRawApplets();
    
    let appletNames = Object.keys( rawApplets );
    
    for ( let i = 0, len = appletNames.length; i < len; ++i ) {
        let name = appletNames[ i ];
        let applet = rawApplets[ name ];
        applet.views = {};
        //skip loaidng applet vies if the view folder does not exist
        if ( !path.existsSync( applet.appletViewDir ) ) {
            continue;
        }
        
        let viewFiles = fs.readdirSync( applet.appletViewDir );
        for (let j = 0, jlen = viewFiles.length; j < jlen; ++j ) {
            applet.views[ viewFiles[ j ] ] = applet.appletViewDir + viewFiles[ j ];
            this._views.push(applet.views[ viewFiles[ j ] ]);
        }
    }
	
	this._viewEngine.setViews( this._views, fn );
};



/*
    Function: render

        Get the rendered contents of a view with the given properties
        
    Parameters:
    
        applet - {String} Name of the raw applet to which the view belongs
        viewName - {String} Name of the view
        props - {Object} Object to pass to pass to view engine for the current view
        
    Return:
        
        {String} Rendered contents of the view
*/
RenderManager.prototype.render = function( applet, viewName, props ) {
    let path = applet.__appletProto.views[ viewName ];
    return this._viewEngine.render( path, props );
};