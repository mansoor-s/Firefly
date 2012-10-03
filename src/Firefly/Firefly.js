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
var async = require( 'async' );
var util = require( 'util' );

var Server = require( '../Server/Server.js' );
var WSServer = require( '../Server/WSServer.js' );
var Router = require( '../Router/Router.js' );
var Request = require( '../Http/Request.js' );
var Response = require( '../Http/Response.js' );
var RenderManager = require( '../RenderManager/RenderManager.js' );
var Logger = require( '../Logger/Logger.js' );
var State = require( '../State/State.js' );


/**
* Firefly object constructor
*
* @class Firefly
* @module Core
* @constructor
* @param {Object} appRoutes reference to the application routes object
* @param {Object} config reference to application config object
*/
var Firefly = module.exports = function( appRoutes, config ) {
    if ( typeof appRoutes !== 'object' || typeof config !== 'object' ) {
        throw Error( 'name: "Bad Parameter", description: "Expecting type `object` for parameters `routes` and `config`."' );
    }
    
    /**
    * Reference to application config object
    *@property config
    *@type Object
    */
    this.config = config;

    /**
    *@private
    *@type Boolean
    *@property _trustProxyData
    */
    this._trustProxyData = false;

    /**
    *@private
    *@type Object
    *@property _appRoutes
    */
    this._appRoutes = appRoutes;

    /**
    *@private
    *@type Object
    *@property _services
    */
    this._services = {};

    /**
    *An instance of the Server Router
    *@property server
    *@type Object
    */
    this.server = new Server( this, this.getRequestHandler() );
    
    /**
    *@private
    *@type Object
    *@property _wsServers
    */
    this._wsServers = {};
    
    /**
    *An instance of the RenderManager Router
    *@type Object
    *@property router
    */
    this.router = new Router( this, this.server );

    /**
    * Reference to un initialized applet objects
    *@private
    *@type Object
    *@property _appletsRaw
    */
    this._appletsRaw = {};
    
    /**
    *@private
    *@type Object
    *@property _applets
    */
    this._applets = {};
    
    /**
    * An instance of the RenderManager object
    *@type Object
    *@property renderManager
    */
    this.renderManager;

    /**
    *@private
    *@type Array
    *@property _initSequence
    */
    this._initSequence = [];
    
    
    
    /**
    *@private
    *@type Array
    *@property _shutdownSequence
    */
    this._shutdownSequence = [];
    
    
    
    /**
    *@private
    *@type Object
    *@property _viewEngine
    */
    this._viewEngine;

    /**
    * An instance of the Logger object
    *@type Object
    *@property logger
    */
    this.logger = new Logger( this );
        
    this.autoloadApplets();
    
    Object.seal(this);
};




/**
* Initialize the application. Caches's all views and starts HTTP and WebSocket servers
*
* @method init
* @param {Function} fn Function to call on HTTP server start
*/
Firefly.prototype.init = function ( fn ) {
    var self = this;
    
    this.server.start( function() {
        if ( self.config.AUTO_START_WS_SERVER === true ) {
            var wsRoutes = self.router.getWSRoutes();
            for ( var wsRoute in wsRoutes ) {
                self._wsServers[ wsRoute ] = new WSServer( self, wsRoutes[ wsRoute ], self.getWSRequestHandler() );
            }
        }

        //execute init sequence for services
        async.series(self._initSequence, function() {
            self.router.buildRoutes();
            
            self.renderManager = new RenderManager( self, self._viewEngine );
            
            self.renderManager.buildViewMap(fn);
            
            //initialize applets
            self._initializeApplets();
        });
    } );
};



/**
* Initialize WebSocket servers. Use this seperatly if using application with cluster. (NOTE: set AUTO_START_WS_SERVER to false in app config object)
*
* @method initWS
*/
Firefly.prototype.initWS = function() {
    if ( this.config.AUTO_START_WS_SERVER === false ) {
        var wsRoutes = this.router.getWSRoutes();
        for ( var wsRoute in wsRoutes ) {
            this._wsServers[ wsRoute ] = new WSServer( this, wsRoutes[ wsRoute ], this.getWSRequestHandler() );
        }
    }
};




/**
* shutdown Firefly. This method will shut down the server and call any shutdown handlers for the services
* that are registered and then call the passed function.
*
* @method shutdown
* @param {Function} fn Callback function 
*/
Firefly.prototype.shutdown = function( fn ) {
    var self = this;
    this._server.stop( function() {
        self._shutdownSequence.reverse();
        
        async.series(self._shutdownSequence, fn);
    } );
};




/**
* Autoload and Use application Applets. This function performes blocking IO (require())
*
* @method autoloadApplets
*/
Firefly.prototype.autoloadApplets = function() {
    var rawAppletNames = fs.readdirSync( this.config.APPLETS_DIR );
    
    for (var i = 0, len = rawAppletNames.length; i < len; ++i ) {
        var thisDir = this.config.APPLETS_DIR + rawAppletNames[ i ];
        var stat = fs.statSync( thisDir );
        if ( !stat.isDirectory() ) {
            continue;
        }
        
        var appletPath = this.config.APPLETS_DIR + rawAppletNames[ i ];
        
        this._appletsRaw[ rawAppletNames[ i ] ] = {
            object: require( appletPath + '/index.js' ),
            routes: require( appletPath + '/Routes.js' ),
            appletViewDir: appletPath + '/views/'
        };
    }
};



/**
* initialize all applets regitered with FIrefly
*
* @private
* @method _initializeApplets
*/
Firefly.prototype._initializeApplets = function() {
    for ( var appletName in this._applets ) {
        this._applets[ appletName ] = new this._applets[ appletName ]( this );
        this._applets[ appletName ].__protoAppletName = appletName;
    }
};



/**
* Get a reference to an applet
*
* @method getApplet
* @param {String} applets Name of the applet instance.. as defined on the main application Route file
* @returns {Object} Reference to applet
*/
Firefly.prototype.getApplet = function( applet ) {
    return this._applets[ applet ];
};




/**
* Return all un-initialized applets
*
* @method getAllRawApplets
* @return {Object} Hash-array contains properties `object`, `routes` and `viewPath`.
*/
Firefly.prototype.getAllRawApplets = function() {
    return this._appletsRaw;
};

    

/**
* Return information about all of the registered applets
*
* @method getAllApplets
* @return {Object} Hash-array contains properties `object` and `routes`.
*/
Firefly.prototype.getAllApplets = function() {
    return this._appletsRaw;
};



/**
* Set an object as a service, accessable application wide
*
* @method set
* @param {String} name Name of service being set
* @param {String} refrence to service object
*/
Firefly.prototype.set = function( name, obj ) {
    if ( !name || !obj ) {
        throw Error( 'name: "Bad Parameter", discription: "Expected parameters of types `string` and `object`"' );
    }
    
    this._services[name] = obj;
};



/**
* Get a reference to the requested service
*
* @method get
* @param {String} name Name of service being requested
* @return {Object} Requested service or undefined if none exist by that handle
*/
Firefly.prototype.get = function( name ) {
    return this._services[name];
};



/**
* Tell Firefly to add an instance of the given applet with the given name
*
* @method addApplet
* @param {String} name Name of applet instance
* @param {Object} applet reference to uninitialized applet object
*/
Firefly.prototype.addAppletInstance = function( name, applet ) {
    this._applets[ name ] = applet;
};



/**
* Get the application routes object that was passed to Firefly by the app
*
* @method getAppRoutes
* @return {Object} Application routes object
*/
Firefly.prototype.getAppRoutes = function() {
    return this._appRoutes;
};



/**
* Wrapper for the request handler of all client requests
*
* @method getRequestHandler
* @return {Function} request handler
*/
Firefly.prototype.getRequestHandler = function() {
    var self = this;
    return function( req, res ) {
        try {
            var request = new Request( req );
            var response = new Response( res, request, self );

            if ( self.server.isSecure() ) {
                request.setServerSecure( true );
            }

            if ( self._trustProxyData ) {
                request.trustProxyData(true);
            }
            
            request.state = new State();

            if(request.getMethod() === 'POST') {
                console.log('request handler. post');
                request.parseForm(function() {
                    console.log('parseForm callback');
                    self.router.findRoute( request, response );
                });
            } else {
                self.router.findRoute( request, response );
            }
            
        } catch( e ) {
            self.catchException( e );
        }
    };
};



/**
* Returns call back to be used for all WS client connections
*
* @method getWSRequestHandler
* @return {Function} WS request handler
*/
Firefly.prototype.getWSRequestHandler = function() {
    var self = this;
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
                var data;
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
            self.catchException( e );
        }
    };
};



/**
* Handle application-wide exceptions
*
* @method catchException
* @param {Object} request Reference to request object
* @param {Object} response Reference to response object
*/
Firefly.prototype.catchException = function( err, request, response ) {
    response.setStatusCode( 500 );
    response.setContent( '505' );
    response.send();
    
    this.logger();

};



/**
* Set a view/templating engine for Firefly to use
*
* @method setViewEngine
* @param {Object} engine reference to the templating engine object
*/
Firefly.prototype.setViewEngine = function( engine ) {
    if (this._initialized === true) {
        this.renderManager.setViewEngine( engine );
    } else {
        this._viewEngine = engine;
    }
};



/**
* Add a callback function to be called when Firefly is initialized. These functions are called
* in order of being added.
*
* @method addInitDependency
* @param {Function} fn callback function to call with another callback function as its parameter which it must call
            to continue the init sequence
*/
Firefly.prototype.addInitDependency = function( fn ) {
    this._initSequence.push(fn);
};



/**
* Add a callback function to be called when Firefly is shutting down. These functions
* are calledin *reverse* order of being added.
*
* @method addInitDependency
* @param {Function} fn callback function to call with another callback function as its parameter which it must call
            to continue the init sequence
*/
Firefly.prototype.addShutdownDependency = function( fn ) {
    this._shutdownSequence.push(fn);
};





/**
* Should Firefly trust data coming from a proxy. (i.e `HTTP_X_FORWARDED_FOR` header)
*
* @method trustProxyData
* @param {Boolean} trust Set true if you have any reverse proxys in front of your server. 
*/
Firefly.prototype.trustProxyData = function( trust ) {
    this._trustProxyData = trust;
};




