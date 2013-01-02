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
*/
Router.prototype.buildRoutes = function() {
    var allRawApplets = this._firefly.getAllRawApplets();
    var appRoutes = this._firefly.getAppRoutes();
    
    for ( var appletInstanceName in appRoutes ) {
        var thisTopLevelRoute = appRoutes[appletInstanceName];
        
        var appletBasePattern = thisTopLevelRoute.basePattern;
        var rawAppletName = thisTopLevelRoute.applet;
        
        var thisRawApplet = allRawApplets[ rawAppletName ];
        
        if ( thisRawApplet === undefined ) {
            throw new Error('Applet `' + rawAppletName + '` is defined in route `' +
                                appletInstanceName + '` but does not exist!'  );
        }
        
        this._firefly.addAppletInstance(appletInstanceName, thisRawApplet.object);
        
        var thisApplet = this._firefly.getApplet(appletInstanceName);
        
        var appletRoutes = thisRawApplet.routes;
        
        
        //ensure the route has `requirements` field of type object even if not specified
        thisTopLevelRoute.requirements = thisTopLevelRoute.requirements || {};
        
        
        //is route a websocket route
        if ( ( thisTopLevelRoute.requirements._transport || '' ).toLowerCase() === 'ws' ) {
            var routeObject = this._wsRoutes[ appletInstanceName ] = {
                'applet': thisApplet,
                'path': appletBasePattern,
                'routes': {}
            };
            
            for ( var wsRouteName in wsRoutes ) {
                routeObject.routes[ wsRouteName ] = thisApplet[ wsRoutes[ wsRouteName ].controller ];
            }
            
            continue;
        }
        
        
        for ( var route in appletRoutes ) {
            var thisRoute = appletRoutes[route];
            
            if ( typeof thisRoute.pattern !== 'string' ) {
                throw new Error( 'name: "Bad Route", description: "Expecting applet route rule to be of type `String`"' );
            }
            
            thisRoute.requirements = thisRoute.requirements || {};
            
            thisRoute._patternRegex = this._creatRegex(appletBasePattern, thisRoute);
            
            //set action controller
            thisRoute._actionController = thisRoute.controller;
            thisRoute._appletName = appletInstanceName;
            thisRoute._fullRoute = appletBasePattern + thisRoute.pattern;
            thisRoute._baseRoute = thisTopLevelRoute;
            this._routes[route] = thisRoute;
        }
    }
    
    this.routeKeys = Object.keys( this._routes );
};




/**
* Creates regular expression for a given route.
*
* @method _creatRegex
* @private
* @param
*
* @returns {RegExp} Regular expression representing the route
*/
Router.prototype._creatRegex = function(basePattern, route) {
    var params = route.pattern.match( /:\w+/g ) || [];
    var tempExp = route.pattern;
    for ( var i = 0, len = params.length; i < len; ++i ) {
        var param = params[ i ].substr( 1 );
        
        // if a reqirement rule exists for the param, use it, otherwise, use /.*/
        var paramRule;
        if ( route.requirements.hasOwnProperty( param ) ) {
            paramRule = route.requirements[ param ];
            
            if ( !paramRule instanceof RegExp ) {
                throw new Error( 'name: "Bad Route", description: "Expecting parameter variable `rule` to be of type `RegExp`"' );
            }
            paramRule = '(' + paramRule.source + ')';
        } else {
            paramRule = '(.*)';
        }
        tempExp = tempExp.replace( /:\w+/, paramRule );
    }
    
    return new RegExp( '^' +  basePattern + tempExp + '$' );
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
* Find the appropriate controller for the incoming client request
*
* @method findRoute
* @param {Object} request Reference to Request object
* @param {Object} response Reference to Response object
* @param {Function} fn Callback function. If one is passed, the callback will be called with
*   the `request`, `response`, and the `controller` function
*/
Router.prototype.findRoute = function( request, response, fn ) {
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
                    var applet = self._firefly.getApplet(route._appletName);
                    params.splice(0,1);
                    delete params.input;
                    delete params.index;
                    params.unshift( request, response );
                    
                    request.setRouteObject( route );
                    request.setApplet( applet );
                    
                    
                    
                    
                    if (fn instanceof Function) {
                        fn(function() {
                            applet[route._actionController].apply( applet, params );
                        });
                    } else {
                        //call action controller
                        applet[route._actionController].apply( applet, params );
                    }
                    
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