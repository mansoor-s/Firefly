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

var async = require( 'async' );


/**
* Router object constructor
*
* @class Router
* @module Core
* @constructor
* @param {Object} firefly reference to the current instance of the Firefly object
*/
var Router = module.exports = function( firefly ) {
    this._firefly = firefly;
    this._routes = {};
    this._wsRoutes = {};
    this._serviceRoutes = [];
    
    this._serviceHandlers = {};

    this._routeRules = {
        '_method': this._methodRule,
        '_transport': this._transportRule
    };

    firefly.set('Router', this);
};



/**
* Build routing patterns for all available applets
*
* @method buildRoutes
* @TODO break this method up
*/
Router.prototype.buildRoutes = function() {
    var allAppletsRaw = this._firefly.getAllRawApplets();
    var appRoutes = this._firefly.getAppRoutes();
    
    for ( var appRoute in appRoutes ) {
        if ( allAppletsRaw[ appRoute.applet ] === undefined ) {
            //check if route is registered to a service
            var thisRoute = appRoutes[ appRoute ];
            if ( thisRoute.service !== undefined ) {
                this._serviceRoutes.push( {
                    'pattern': new RegExp( thisRoute.basePattern + '.*' ),
                    'handler': this._serviceHandlers[ thisRoute.service ],
                    'service': this._firefly.get( thisRoute.service )
                } );
                continue;
            }
        }

        var appletBasePattern = appRoutes[ appRoute ].basePattern;
        var appletName = appRoutes[ appRoute ].applet;
        
        if ( allAppletsRaw[ appletName ] === undefined ) {
            throw Error( 'Applet `' + appletName + '` does not exist!');
        }

        var routes = allAppletsRaw[ appletName ].routes;
        
        var applet = {
            object: new allAppletsRaw[ appletName ].object( this._firefly ),
            appletProto: allAppletsRaw[ appletName ]
        };

        applet.object.__appletProto = allAppletsRaw[ appletName ];
        
        //register the instance of the applet and name with firefly
        this._firefly.addApplet( appRoute, applet );

        appRoutes[ appRoute ].requirements = appRoutes[ appRoute ].requirements || {};

        //if the route is for websocket connections, there is no need to create normal routes for it
        if ( ( appRoutes[ appRoute ].requirements._transport || '' ).toLowerCase() === 'ws' ) {
            appRoutes[ appRoute ]._applet = applet.object;
            appRoutes[appRoute].applet = appRoute;
            appRoutes[appRoute].appletRaw = allAppletsRaw[ appletName ];
            this._buildWSRoute( appRoutes[ appRoute ], routes );
            continue;
        }
        
        for ( var route in routes ) {
            if ( typeof routes[ route ].pattern !== 'string' ) {
                throw Error( 'name: "Bad Route", description: "Expecting applet route rule to be of type `String`"' );
            }

            routes[ route ].requirements = routes[ route ].requirements || {};
             
            //parse for route parameters
            var params = routes[ route ].pattern.match( /:\w+/g ) || [];
            var tempExp = routes[ route ].pattern;
            for ( var i = 0, len = params.length; i < len; ++i ) {
                var param = params[ i ].substr( 1 );
                
                // if a reqirement rule exists for the param, use it, otherwise, use /.*/
                var paramRule;
                if ( routes[ route ].requirements.hasOwnProperty( param ) ) {
                    paramRule = routes[ route ].requirements[ param ];
                    if ( !paramRule instanceof RegExp ) {
                        throw Error( 'name: "Bad Route", description: "Expecting parameter letiable rule to be of type `RegExp`"' );
                    }
                    paramRule = '(' + paramRule.source + ')';
                } else {
                    paramRule = '(.*)';
                }
                tempExp = tempExp.replace( /:\w+/, paramRule );
            }
            
            var controller = routes[ route ].controller;
            routes[ route ]._patternRegex = new RegExp( '^' +  appletBasePattern + tempExp + '$' );
            
            //action controller function
            routes[ route ]._actionController = applet.object[ controller ];
            
            //reference to instance of applet object
            routes[ route ]._applet = applet.object
            routes[ route ]._fullRoute = appletBasePattern + routes[ route ].pattern;
            
            //applet base route
            routes[ route ]._baseRoute = appRoutes[ appRoute ];
            
            this._routes[ route ] = routes[ route ];

            this.routeKeys = Object.keys( this._routes );
        }
    }
};



/**
* Rebuilds application route rules. Call this if application's routes are changed
            post init.
*
* @method rebuildRoutes
*/
Router.prototype.rebuildRoutes = function() {
    this._routes = {};
    this._serviceRoutes = {};
    this._wsRoutes = {};
    this.buildRoutes();
};



/**
* Create routes (callbacks for given event name) for a given websocket route. 
            No rich route rules for ws routes to reduce overhead
*
* @method _buildWSRoute
* @private
* @param {Object} appRoute Reference to application route object
* @param {Object} routes Reference to the applet's routes object
*/
Router.prototype._buildWSRoute = function( appRoute, routes ) {
    var allAppletsRaw = this._firefly.getAllRawApplets();
    var wsRoutes = this._wsRoutes[ appRoute.applet ] = {
        'applet': appRoute.applet,
        'path': appRoute.basePattern,
        'routes': {}
    };
    
    for ( var route in routes ) {
        wsRoutes.routes[ route ] = appRoute._applet[ routes[ route ].controller ];
    }
};




/**
* Find the appropriate controller for the incoming client request
*
* @method findRoute
* @param {Object} request Reference to Request object
* @param {Object} response Reference to Response object
*/
Router.prototype.findRoute = function( request, response ) {
    var routeFound;
    var basePath = request.getBasePath();
    var self = this;

    //test for service routes
    for ( var i = 0, len = this._serviceRoutes.length; i < len; ++i ) {
        var serviceRoute = this._serviceRoutes[ i ];
        if ( serviceRoute.pattern.test( basePath ) ) {
            serviceRoute.handler.call( serviceRoute.service, request, response );
            routeFound = true;
        }
    }

    //test for normal routes
    if ( !routeFound && self.routeKeys.length ) {
        ( function routesIttr( currRoute ) {
            var route = self._routes[ self.routeKeys[ currRoute ] ];
            
            var routeTest = route._patternRegex.test( basePath );
            if ( !routeTest && ( currRoute === self.routeKeys.length - 1 ) ) {
                self.routeNotFound( request, response );
                return;
            } else if ( !routeTest ) {
                routesIttr( ++currRoute );
                return;
            }

            self._testRouteRules( request, response, route, function( pass ) {
                if ( pass ) {
                    var params = route._patternRegex.exec( basePath ) || [];
                    var applet = route._applet;
                    params.unshift( request, response );
                    
                    request.setRouteObject( route );
                    request.setApplet( applet );

                    //call action controller
                    route._actionController.apply( applet, params );
                    
                // if it is the last route and it's rules were not met, then give 404
                } else if ( !pass && ( currRoute === self.routeKeys.length - 1 ) ) {
                    self.routeNotFound( request, response ); 
                } else {
                    routesIttr( ++currRoute );
                }
            } );
        } )( 0 );
    }
};



/**
* Makes sure that the request meets all of the requirements of the route
*
* @method _testRouteRules
* @private
* @param {Object} request Reference to Request object
* @param {Object} response Reference to Response object
* @param {Object} route Reference to the route object
* @param {Function} fn callback function
*/
Router.prototype._testRouteRules = function( request, response, route, fn ) {
    var rules = Object.keys(this._routeRules);
    var self = this;
    if ( rules.length ) {
        ( function rulesIttr( curr ) {
            var ruleName = rules[ curr ];
            var rule;
            if (route.requirements[ ruleName ] !== undefined) {
                rule = route.requirements[ ruleName ];
            } else {
                rule = route._baseRoute.requirements[ ruleName ];
            }

            if ( rule !== undefined) {
                self._routeRules[ ruleName ]( request, response, rule,  function( ruleSatisfied, end ) {
                    if ( end ) {
                        return;
                    }

                    if ( ( curr === rules.length - 1 ) && ruleSatisfied ) {
                        fn( true );
                    } else if ( ruleSatisfied ) {
                        rulesIttr( ++curr );
                    } else {
                        fn( false );
                    }
                    
                } );
            } else if ( !rule && ( curr === rules.length - 1 ) ) {
                fn( true );
            } else {
                rulesIttr( ++curr );
            }
        } )( 0 );
    }
};



/**
* Find the appropriate controller for the WebSocket event
*
* @method findWSRoute
* @param {Object} wsInfo reference to winsocket info object
* @param {Object} socket reference to the websocket object
* @param {Object} data reference to data recieved from client
*/
Router.prototype.findWSRoute = function( wsInfo, socket, data ) {
    var routeFound = false;
    var paths = this._wsRoutes[ wsInfo.applet ].routes;

    for ( var path in paths ) {
        if (typeof data === 'string') {
            break;
        } else if ( path === data.id ) {
            var allApplets = this._firefly.getAllApplets();
            var applet = allApplets[ wsInfo.applet ];
            
            // call action controller
            paths[ path ].call( applet, socket, data );
            
            routeFound = true;
            break;
        }
    }
    
    if( !routeFound ) {
        this.wsRouteNotFound( socket, data );
    }
};




/**
* Generate url based on the route name and specified URL parameters
*
* @method generateUrl
* @param {String} routeName Name of the route based which to generate the URL
* @param {Object} params Object literal containing name and values for URL parameters
* @return {String} Generated URL
*/
Router.prototype.generateUrl = function( routeName, params ) {
    var route = this._routes[ routeName ];
    
    if ( route === undefined) {
        throw Error( 'Name: "Bad Route Name", Description, "Specified route name `' 
            + routeName + '` does not correspond to any routes"' );
    }
    
    var config = this._firefly.config;
    var fullRoute =  this._routes[ routeName ]._fullRoute;
    for ( var param in params ) {
        if ( !params.hasOwnProperty( param ) ) {
            continue;    
        }
        
        fullRoute.replace( ':' + param, params[ param ]);
    }
    
    return config.PROTOCOL + '://' + config.PUB_HOST + route._fullRoute;
};




/**
* Test for the _method route rule
*
* @method _methodRule
* @private
* @param {Object} request Instance of request objecr for the current request
* @param {Array|String} rule value of rule as specified in the route file
* @param {Function} callback function taking result of the test as its parameter
*/
Router.prototype._methodRule = function( request, response, rule, fn ) {
    var method = request.getMethod();
    if ( rule instanceof Array ) {
        if ( rule.indexOf( method ) !== -1 ) {
            fn(true);
            return;
        }
    } else if ( typeof rule === 'string' ) {
        if ( rule === method ) {
            fn(true);
            return;
        }
    }
    
    fn(false);
};




/**
* Test for the _transport route rule
*
* @method _transportRule
* @private
* @param {Object} request Instance of request objecr for the current request
* @param {Array|String} rule value of rule as specified in the route file
* @param {Function} callback function taking result of the test as its parameter
*/
Router.prototype._transportRule = function( request, response, rule, fn ) {
    var transport = request.getTransport();
    if ( rule instanceof Array ) {
        if ( rule.indexOf( transport ) !== -1 ) {
            fn(true);
            return;   
        }
    } else if ( typeof rule === 'string' ) {
        if ( rule === transport ) {
            fn(true);
            return;  
        }
    }
    
    fn(false);
};



/**
* Get a reference to the object holding the routes for websockets
*
* @method getWSRoutes
* @return {Object} reference to WS routes object for the entire appliction
*/
Router.prototype.getWSRoutes = function() {
    return this._wsRoutes;    
};



/**
* Method called by router if no route is found for the request
*
* @method routeNotFound
* @param {Object} request Reference to requst object
* @param {Object} response Reference to response object
*/
Router.prototype.routeNotFound = function( request, response ) {
    // give 404 error
    response.setStatusCode(404)
    response.setContent('<html><head></head><body><h1>404</h1></body></html>');
    response.send();
};



/**
* Method called by router if no route is found for the websocket request
*
* @method wsRouteNotFound
* @param {Object} socket reference to client's socket object
* @param {Object} data reference to object holding data
*/
Router.prototype.wsRouteNotFound = function( socket, data ) {
    socket.send(JSON.stringify({status: '404'}));
};



/**
* Set a function as the request handler for a service. If a route is registered to 
            the specified service, then this function will be called with an instance of 
            the Request and Response objects before calling the controller. Firefly will
            prepend the 
* @example
        addRouteRequirement('useraccess', function(req, res, rule, fn) {
            fn(true) //passes test
            fn(false, true) //failed test. hault routing. the service will take care of showing error touser
            fn(false, false) // failed test. continue routing
        });
        
        
        //In routes file useraccess will be declared as:
        _useraccess: 'admin'
        //thus the value of `rule` in the service handler will be 'admin'
        
*
* @method addRouteRequirement
* @param {String} name Name of the rule. An _ (underscore) is prepended to the name
* @param {Function} fn listener function to be used as the request handler
*/
Router.prototype.addRouteRequirement = function( name, fn ) {
    this._routeRules[ '_' + name ] = fn;
};