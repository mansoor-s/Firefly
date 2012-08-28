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
let async = require( 'async' );

let Server = require( '../Server/Server.js' );
let WSServer = require( '../Server/WSServer.js' ).;
let Router = require( '../Router/Router.js' );
let Request = require( '../Http/Request.js' );
let Request = require( '../Http/Response.js' );
let RenderManager = require( '../RenderManager/RenderManager.js' );


/*
    Function: Firefly

        Firefly object constructor.

    Parameters:

        appRoutes - {Object} Refrence to the application routes object
        config - {Object} Refrence to application config object
*/
let Firefly = module.exports = function( appRoutes, config ) {
    if ( typeof appRoutes !== 'object' || typeof config !== 'object' ) {
        throw Error( 'name: "Bad Parameter", description: "Expecting type `object` for parameters `routes` and `config`."' );
    }
    
    this.config = config;

    this._trustProxyData = false;

    this._appRoutes = appRoutes;

    this._services = {};

    this.server = new Server( this, this.getRequestHandler() );
    
    this._wsServers = {};
    
    this.router = new Router( this, this.server );

    this._services['Server'] = this.server;
    this._services['Router'] = this.router;

    this._appletsRaw = {};
    this._applets = {};
    this.renderManager;

    this._initSequence = [];
    
    this._viewEngine;
    this._initialized = false;
    
    this.autoloadApplets();
};




/*
    Function: init

        Initialize the application. Caches's all views and starts HTTP and WebSocket servers
        
    Parameters:
    
        fn - {Function} Function to call on HTTP server start
*/
Firefly.prototype.init = function( fn ) {
    let self = this;
    this._initialized = true;
    
    this.server.start( function() {
        if ( self.config.AUTO_START_WS_SERVER === true ) {
            let wsRoutes = self.router.getWSRoutes();
            for ( let wsRoute in wsRoutes ) {
                self._wsServers[ wsRoute ] = new WSServer( self, wsRoutes[ wsRoute ], self.getWSRequestHandler() );
            }
        }

        //execute init sequence for services
        async.series(self._initSequence, function() {
            self.router.buildRoutes();
            
            self.renderManager = new RenderManager( self, self._viewEngine );
            
            self.renderManager.buildViewMap(fn);
        });
    } );
};



/*
    Function: initWS

        Initialize WebSocket servers. Use this seperatly if using application with cluster. (NOTE: set AUTO_START_WS_SERVER to false in app config object)
*/
Firefly.prototype.initWS = function() {
    if ( this.config.AUTO_START_WS_SERVER === false ) {
        let wsRoutes = this.router.getWSRoutes();
        for ( let wsRoute in wsRoutes ) {
            this._wsServers[ wsRoute ] = new WSServer( this, wsRoutes[ wsRoute ], this.getWSRequestHandler() );
        }
    }
};




/*
    Function: autoloadApplets

        Autoload and Use application Applets. This function performes blocking IO (require())
*/
Firefly.prototype.autoloadApplets = function() {
    let rawAppletNames = fs.readdirSync( this.config.APPLETS_DIR );
    
    for (let i = 0, len = rawAppletNames.length; i < len; ++i ) {
        let thisDir = this.config.APPLETS_DIR + rawAppletNames[ i ];
        let stat = fs.statSync( thisDir );
        if ( !stat.isDirectory() ) {
            continue;
        }
        
        let appletPath = this.config.APPLETS_DIR + rawAppletNames[ i ];
        
        this._appletsRaw[ rawAppletNames[ i ] ] = {
            object: require( appletPath + '/index.js' ),
            routes: require( appletPath + '/Routes.js' ),
            appletViewDir: appletPath + '/views/'
        };
    }
};



/*
    Function: getApplet

        Return information on the specified applet
        
    Parameters:
        
        applets - {String} Name of the applet .. as defined on the main application Route file
        
    Returns: {Object} Hash-array contains properties `object` and `routes`
*/
Firefly.prototype.getApplet = function( applet ) {
    return this._applets[ applet ];
};




/*
    Function: getAllRawApplets

        Return information on the specified applet
        
    Returns: {Object} Hash-array contains properties `object`, `routes` and `viewPath`.
*/
Firefly.prototype.getAllRawApplets = function() {
    return this._appletsRaw;
};

    

/*
    Function: getAllApplets

        Return information about all of the registered applets

    Returns: {Object} Hash-array contains properties `object` and `routes`.
*/
Firefly.prototype.getAllApplets = function() {
    return this._appletsRaw;
};



/*
    Function: set

        Set an object as a service, accessable application wide
        
    Parameters:
        
        name - {String} Name of service being set
*/
Firefly.prototype.set = function( name, obj ) {
    if ( !name || !obj ) {
        throw Error( 'name: "Bad Parameter", discription: "Expected parameters of types `string` and `object`"' );
    }
    
    this._services[name] = obj;
};



/*
    Function: get

        Get a refrence to the requested service
        
    Parameters:
        
        name - {String} Name of service being requested

    Returns:

        {Object} Requested service or undefined if none exist by that handle
*/
Firefly.prototype.get = function( name ) {
    return this._services[name];
};



/*
    Function: addApplet

        Add an initialized applet object
        
    Parameters:
        
        name - {String} Name of applet
        applet - {Object} Refrence to applet object
*/
Firefly.prototype.addApplet = function( name, applet ) {
    if ( !name || !applet ) {
        throw Error( 'name: "Bad Parameter", description: "Expected parameters of types `string` and `object`"' );
    }

    this._applets[ name ] = applet;
};



/*
    Function: getAppRoutes

        Get the application routes object that was passed to Firefly by the app

    Returns:

        {Object} Application routes object
*/
Firefly.prototype.getAppRoutes = function() {
    return this._appRoutes;
};



/*
    Function: getRequestHandler

        Wrapper for the request handler of all client requests
        
    Returns:
    
        {Function} request handler
*/
Firefly.prototype.getRequestHandler = function() {
    let self = this;
    return function( req, res ) {
        try {
            let request = new Request( req );
            let response = new Response( res, request, self );

            if ( self.server.isSecure() ) {
                request.setServerSecure( true );
            }

            if ( self._trustProxyData ) {
                request.trustProxyData(true);
            }

            if(request.getMethod() === 'POST') {
                request.parseForm(function() {
                    self.router.findRoute( request, response );
                });
            } else {
                self.router.findRoute( request, response );
            }
            
        } catch( e ) {
            self.catch( e );
        }
    };
};


/*
    Function: getWSRequestHandler

        Returns call back to be used for all WS client connections
        
    Returns:
    
        {Function} WS request handler
*/
Firefly.prototype.getWSRequestHandler = function() {
    let self = this;
    // connection handler
    return function( wsInfo, socket ) {
        try {
            //find correct connect controller
            self.router.findWSRoute( wsInfo, socket, {
                'id': 'connection'
            });
            
            //find correct message controller
            socket.on( 'message', function( dataRaw ) {
                //parse JSON if it is in the notation otherwise pass it as is
                let data;
                try {
                    data = JSON.parse( dataRaw );
                } catch ( e ) {
                    data = dataRaw;
                }
                
                self.router.findWSRoute( wsInfo, socket, data );
            } );
            
            socket.on( 'disconnect', function() {
                self.router.findWSRoute( wsInfo, socket, {
                    'id': 'disconnect'
                } );
            } );
        } catch( e ) {
            self.catch( e );
        }
    };
};



/*
    Function: catch

        Handle application-wide exceptions

    Parameters:
        request - Request object
        response - Response object

    Returns:

        {Object} Error object
*/
Firefly.prototype.catch = function( err, request, response ) {
    let logger = this.get( 'Logger' );
    logger.log( err );

};


/*
    Function: setViewEngine

        Set a view/templating engine for Firefly to use
        
    Parameters:
        
        engine - refrence to the templating engine object
*/
Firefly.prototype.setViewEngine = function( engine ) {
    if (this._initialized === true) {
        this.renderManager.setViewEngine( engine );
    } else {
        this._viewEngine = engine;
    }
};



/*
    Function: setViewEngine

        Add a callback function to be called when init() is called on Firefly. These functions are executed in sequence.
        
    Parameters:
        
        fn - callback function to call with another callback function as its parameter which it must call
            to continue the init sequence
*/
Firefly.prototype.addInitDependency = function( fn ) {
    this._initSequence.push(fn);
};



/*
    Function: trustProxyData

    Should Firefly trust data coming from a proxy. (i.e `HTTP_X_FORWARDED_FOR` header)
    
    Parameters:
        
        trust - {Boolean} Set true if you have any reverse proxys in front of your server. 
*/
Firefly.prototype.trustProxyData = function( trust ) {
    this._trustProxyData = trust;
};