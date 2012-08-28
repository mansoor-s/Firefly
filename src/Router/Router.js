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

let async = require( 'async' );

/*
    Function: Router

    Router object constructor

    Parameters:

        firefly - Refrence to the current instance of the Firefly object
*/
let Router = module.exports = function( firefly ) {
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



/*
    Function: buildRoutes

        Build routing patterns for all available applets
*/
Router.prototype.buildRoutes = function() {
    let allAppletsRaw = this._firefly.getAllRawApplets();
    let appRoutes = this._firefly.getAppRoutes();
    
    for ( let appRoute in appRoutes ) {
        if ( allAppletsRaw[ appRoute.applet ] === undefined ) {
            //check if route is registered to a service
            let thisRoute = appRoutes[ appRoute ];
            if ( thisRoute.service !== undefined ) {
                this._serviceRoutes.push( {
                    'pattern': new RegExp( thisRoute.basePattern + '.*' ),
                    'handler': this._serviceHandlers[ thisRoute.service ],
                    'service': this._firefly.get( thisRoute.service )
                } );
                continue;
            }
        }

        let appletBasePattern = appRoutes[ appRoute ].basePattern;
        let appletName = appRoutes[ appRoute ].applet;
        
        if ( allAppletsRaw[ appletName ] === undefined ) {
            throw Error( 'Applet `' + appletName + '` does not exist!');
        }

        let routes = allAppletsRaw[ appletName ].routes;
        
        let applet = {
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
        
        for ( let route in routes ) {
            if ( typeof routes[ route ].pattern !== 'string' ) {
                throw Error( 'name: "Bad Route", description: "Expecting applet route rule to be of type `String`"' );
            }

            routes[ route ].requirements = routes[ route ].requirements || {};
             
            //parse for route parameters
            let params = routes[ route ].pattern.match( /:\w+/g ) || [];
            let tempExp = routes[ route ].pattern;
            for ( let i = 0, len = params.length; i < len; ++i ) {
                let param = params[ i ].substr( 1 );
                
                // if a reqirement rule exists for the param, use it, otherwise, use /.*/
                let paramRule;
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
            
            let controller = routes[ route ].controller;
            routes[ route ]._patternRegex = new RegExp( '^' +  appletBasePattern + tempExp + '$' );
            
            //action controller function
            routes[ route ]._actionController = applet.object[ controller ];
            
            //refrence to instance of applet object
            routes[ route ]._applet = applet.object
            routes[ route ]._fullRoute = appletBasePattern + routes[ route ].pattern;
            
            //applet base route
            routes[ route ]._baseRoute = appRoutes[ appRoute ];
            
            this._routes[ route ] = routes[ route ];

            this.routeKeys = Object.keys( this._routes );
        }
    }
};



/*
    Function: rebuildRoutes

        Rebuilds application route rules. Call this if application's routes are changed
            post startup.
    
    Parameters:
    
        appRoute - {Object} refrence to the app route object
*/
Router.prototype.rebuildRoutes = function() {
    this._routes = {};
    this._serviceRoutes = {};
    this._wsRoutes = {};
    this.buildRoutes();
};


/*
    Function: _buildWSRoute

        Create routes (callbacks for given event name) for a given websocket route. 
            No rich route rules for ws routes to reduce overhead
    
    Parameters:
    
        appRoute - {Object} refrence to the app route object
*/
Router.prototype._buildWSRoute = function( appRoute, routes ) {
    let allAppletsRaw = this._firefly.getAllRawApplets();
    let wsRoutes = this._wsRoutes[ appRoute.applet ] = {
        'applet': appRoute.applet,
        'path': appRoute.basePattern,
        'routes': {}
    };
    
    for ( let route in routes ) {
        wsRoutes.routes[ route ] = appRoute._applet[ routes[ route ].controller ];
    }
};




/*
    Function: findRoute

        Find the appropriate controller for the incoming client request
        
    Parameters:
    
        request - {Object} Client's Request object
        response - {Object} Client's Response object
*/
Router.prototype.findRoute = function( request, response ) {
    let routeFound;
    let basePath = request.getBasePath();
    let self = this;

    //test for service routes
    for ( let i = 0, len = this._serviceRoutes.length; i < len; ++i ) {
        let serviceRoute = this._serviceRoutes[ i ];
        if ( serviceRoute.pattern.test( basePath ) ) {
            serviceRoute.handler.call( serviceRoute.service, request, response );
            routeFound = true;
        }
    }

    //test for normal routes
    if ( !routeFound && self.routeKeys.length ) {
        ( function routesIttr( currRoute ) {
            let route = self._routes[ self.routeKeys[ currRoute ] ];
            
            let routeTest = route._patternRegex.test( basePath );
            if ( !routeTest && ( currRoute === self.routeKeys.length - 1 ) ) {
                self.routeNotFound( request, response );
                return;
            } else if ( !routeTest ) {
                routesIttr( ++currRoute );
                return;
            }

            self._testRouteRules( request, response, route, function( pass ) {
                if ( pass ) {
                    let params = route._patternRegex.exec( basePath ) || [];
                    let applet = route._applet;
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


/*
    Function: _testRouteRules

        Find the appropriate controller for the WebSocket event
        
    Parameters:
    
        request - {Object} Client's Request object
        response - {Object} Client's Response object
*/
Router.prototype._testRouteRules = function( request, response, route, fn ) {
    let rules = Object.keys(this._routeRules);
    let self = this;
    if ( rules.length ) {
        ( function rulesIttr( curr ) {
            let ruleName = rules[ curr ];
            let rule;
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



/*
    Function: findWSRoute

        Find the appropriate controller for the WebSocket event
        
    Parameters:
    
        wsInfo - {Object} Refrence to winsocket info object
        socket - {Object} Refrence to the websocket object
        data - {Object} Refrence to data recieved from client
*/
Router.prototype.findWSRoute = function( wsInfo, socket, data ) {
    let routeFound = false;
    let paths = this._wsRoutes[ wsInfo.applet ].routes;

    for ( let path in paths ) {
        if (typeof data === 'string') {
            break;
        } else if ( path === data.id ) {
            let allApplets = this._firefly.getAllApplets();
            let applet = allApplets[ wsInfo.applet ];
            
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




/*
    Function: generateUrl

        Generate url based on the route name and specified URL parameters
    
    Parameters:
    
        routeName - {String} Name of the route based which to generate the URL
        params - {Object} Object literal containing name and values for URL parameters

    Returns
        {String} Generated URL
*/
Router.prototype.generateUrl = function( routeName, params ) {
    let route = this._routes[ routeName ];
    
    if ( route === undefined) {
        throw Error( 'Name: "Bad Route Name", Description, "Specified route name `' 
            + routeName + '` does not correspond to any routes"' );
    }
    
    let config = this._firefly.config;
    let fullRoute =  this._routes[ routeName ]._fullRoute;
    for ( let param in params ) {
        if ( !params.hasOwnProperty( param ) ) {
            continue;    
        }
        
        fullRoute.replace( ':' + param, params[ param ]);
    }
    
    return config.PROTOCOL + '://' + config.PUB_HOST + route._fullRoute;
};




/*
    Function: _methodRule

        Test for the _method route rule
    
    Parameters:
    
        request - {Object} Instance of request objecr for the current request
        rule - {Array|String} value of rule as specified in the route file

    Returns
        {Boolean} True if the rule requrements are met, otherwise false
*/
Router.prototype._methodRule = function( request, response, rule, fn ) {
    let method = request.getMethod();
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




/*
    Function: _transportRule

        Test for the _transport route rule
    
    Parameters:
    
        request - {Object} Instance of request objecr for the current request
        rule - {Array|String} value of rule as specified in the route file

    Returns
        {Boolean} True if the rule requrements are met, otherwise false
*/
Router.prototype._transportRule = function( request, response, rule, fn ) {
    let transport = request.getTransport();
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
    
    return(false);
};



/*
    Function: getWSRoutes

        Get a refrence to the object holding the routes for websockets

    Returns
        {Object} Refrence to WS routes object
*/
Router.prototype.getWSRoutes = function() {
    return this._wsRoutes;    
};



/*
    Function: setServiceHandler

        Set a function as the request handler for a given service. If a route is registered to 
            the specified service, then this function will be called with an instance of 
            the Request and Response objects before calling the controller.

    Parameters
        name - {Object} Name of the service
        fn - {Function} listener function to be used as the request handler
*/
Router.prototype.setServiceHandler = function( name, fn ) {
    this._serviceHandlers[ name ] = fn;
}




/*
    Function: routeNotFound

        Method called by router if no route is found for the request

    Parameters:

        request - {Object} instance of Request object
        response - {Object} instance of the Response object
*/
Router.prototype.routeNotFound = function( request, response ) {
    // give 404 error
    response.setStatusCode(404)
    response.setContent('<html><head></head><body><h1>404</h1></body></html>');
    response.send();
};



/*
    Function: wsRouteNotFound

        Method called by router if no route is found for the request

    Parameters:

        socket - {Object} Refrence to client's socket object
        data - {Object} refrence to object holding data
*/
Router.prototype.wsRouteNotFound = function( socket, data ) {
    socket.send(JSON.stringify({status: '404'}));
};



/*
    Function: addRouteRequirement

        Add 

    Parameters:

        name - {String} Name of route rule. An _ (underscore) is prepended to the name route
        fn - {Function} Callback with parameters: request, response, function
*/
Router.prototype.addRouteRequirement = function( name, fn ) {
    this._routeRules[ '_' + name ] = fn;
};