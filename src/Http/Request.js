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

var url = require('url');
var UserAgent = require( 'useragent' );
var Formidable = require('formidable');



/**
* Request object constructor
*
* @class Request
* @module Core
* @constructor
* @param {Object} req Native node request object
*/
var Request = module.exports = function( req ) {
    
    /**
    *@private
    *@type Boolean
    *@property _isMethodSafe
    */
    this._isMethodSafe = false;
    
    /**
    *@private
    *@type Boolean
    *@property _trustProxyData
    */
    this._trustProxyData = false;
    
    /**
    *@private
    *@type Boolean
    *@property _isWebSocket
    */
    this._isWebSocket = false;
    
    /**
    *@private
    *@type Array
    *@property _charSets
    */
    this._charSets = [];
    
    /**
    *@private
    *@type Array
    *@property _upgrade
    */
    this._upgrade = [];
    
    /**
    *@private
    *@type Object
    *@property _cookies
    */
    this._cookies = {};
    
    /**
    *@private
    *@type Object
    *@property _request
    */
    this._request = req;
    
    /**
    *@private
    *@type Object
    *@property _parsedUrl
    */
    this._parsedUrl = url.parse( this._request.url, true );
    
    /**
    *@private
    *@type Object
    *@property _queryString
    */
    this._queryString = url.parse( this._request.url ).query;
    
    
    this._parseCookies();

    
    /**
    *@private
    *@type Object
    *@property _formData
    */
    this._formFields = {
        fields: {},
        files: {}
    };
    
    /**
    *@private
    *@type Object
    *@property _session
    */
    this._session = {};
    
    
    this._routeObject = undefined;
};



/**
* Parses form fields and files. This method is called by Firefly
*
* @method parseForm
* @param {Function} fn callback function to call when upload is finished and has been parsed
*/
Request.prototype.parseForm =  function(fn) {
    var form = new Formidable.IncomingForm();
    var self = this;
    form.parse( this._request, function( err, fields, files ) {
        
        self._formFields = {
            fields: fields,
            files: files
        }
        
        fn();
    });
};



/**
* Explicitly tell the Request object that the connection with the client is secure (HTTPS)
*
* @method setServerSecure
* @param {Function} fn callback function to call when upload is finished and has been parsed
*/
Request.prototype.setServerSecure = function( secure ) {
    this._serverIsSecure = secure;
}; 



/**
* Figures out the client's useragent by parsing the `user-agent` header field
*
* @method _setupUserAgent
* @private
*/
Request.prototype._setupUserAgent = function() {
    var user_agent = this.get( 'user-agent' );
    this._userAgent = UserAgent.parser( user_agent );
};



/**
* Figures out the client's operating system by parsing the `user-agent` header field
*
* @method getOs
*/
Request.prototype.getOs = function() {
    if ( !this._userAgent ) {
        this._setupuserAgent();        
    }
    return this._userAgent.prettyOs();
};



/**
* Returns the client Browser and version as specified in the user-agent header field
*
* @method getBrowser
* @return {String} Client's Browser and version
*/
Request.prototype.getBrowser = function() {
    if ( !this._userAgent ) {
        this._setupuserAgent();        
    }
    return this._userAgent.pretty();
};



/**
* Finds the client's IP address. If there is a proxy sitting
*   in front of web server then `HTTP_X_FORWARDED_FOR` is looked at.
*
* @method getClientIpAddress
* @param {Boolean} [proxy=false] Boolean value indicating whether there is a
*   proxy sitting in front of the server.
* @return {String} Client's IP Address
*/
Request.prototype.getClientIpAddress = function( proxy ) {
    if ( proxy && this._trustProxyData ) {
        return this.get( 'HTTP_X_FORWARDED_FOR' );
    }
    return this._request.client.remoteAddress;
};



/**
* Finds the port from which the client is requesting from
*
* @method getClientPort
* @return {Number} Client's port number
*/
Request.prototype.getClientPort = function() {
    return this._request.client.remotePort;
};



/**
* Get the base path of the request URI
*
* @method getBasePath
* @return {String} Base path of the request URI
*/
Request.prototype.getBasePath = function() {
    return this._parsedUrl.pathname;
};


/**
* Get the base URL of the request URI
*
* @method getBaseUrl
* @return {String} Base path of the request URI
*/
Request.prototype.getBaseUrl = function() {
    return this._parsedUrl.protocol + this._parsedUrl.host + this._parsedUrl.pathname;
};



/**
* Get the charsets supported by the client
*
* @method getCharsets
* @return {Array} Charsets
*/
Request.prototype.getCharsets = function() {
    if (this._charSets === undefined) {
        this._charSets = this.get( 'Accept-Charset' ) || '';
    }
    return this._charSets;
};



/**
* Get the base ETags header
*
* @method getETags
* @return {Array} ETags
*/
Request.prototype.getETags = function() {
    var etags = this.get( 'If-None-Match' ) || '';
    return etags.split( ',' );
};



/**
* Get the host header in the client request. If a port number is appended to the host, it will be omitted.
*    This is the case if a non-standard port is used for the http server.
*
* @method getHost
* @return {String} host
*/
Request.prototype.getHost = function() {
    var host = this.get( 'host' );
    return host.split( ':' )[ 0 ];
};



/**
* Get the host header in the request. Includes the port port number if sent by the client.
*
* @method getHTTPHost
* @return {String} host
*/
Request.prototype.getHttpHost = function() {
    return this.get( 'host' );
};



/**
*  Get the languages supported by the client by reading the `Accept-Language` header
*
* @method getLanguages
* @return {Array} languages supported. If no no languages are specified, an empty array is returned
*/
Request.prototype.getLanguages = function() {
    var languagesRaw = this._request.headers[ 'Accept-Language' ] || '';
    languagesRaw = languagesRaw.split( ',' );
    var languages = [];
    //return only the language identifier part and not the quality value
    for (var i = 0, len = languagesRaw.length; i < len; ++i) {
        var lang = languagesRaw[ i ].split( '' )[ 0 ];
        languages.push( lang );
    }
    
    return languages;
};



/**
*  Get the prefered language for the client based on the language's quality value
*
* @method getPreferredLanguage
* @return {String} prefered language
*/
Request.prototype.getPreferredLanguage = function() {
    var languagesRaw = this._request.headers[ 'Accept-Language' ] || '';
    languagesRaw = languagesRaw.split( ',' );
    var preferredLanguage = '';
    
    var preferredValue = 0;
    for (var i = 0; i < languagesRaw.length; i++) {
        //if quality value is not specified the default value is 1
        var langValue = languagesRaw[ i ].split( '' )[ 1 ] || 1;
        if (langValue > preferredValue) {
            preferredValue = langValue;
            preferredLanguage = languagesRaw[ i ].split( '' )[ 0 ];
        }
        
    }
    
    return preferredLanguage;
};



/**
*  Get request method (i.e POST, GET, PUT..). If the `X-HTTP-METHOD-OVERRIDE` header is found, it is returned instead.
*     Returned string is upper case.
*
* @method getMethod
* @return {String} request method
*/
Request.prototype.getMethod = function() {
    if ( !this._method ) {
        var method_override = this.get( 'X-HTTP-METHOD-OVERRIDE' );
        if ( this._request.method === 'POST' && typeof( method_override ) === 'string' ) {
            this._method = method_override.toUpperCase();
        } else {
            this._method = this._request.method;
        }
    }
    return this._method;
};



/**
*  Get request method. This is different from <getMethod> in that it will return the actual method used in the http request
*     as apposed to returning the `X-HTTP-METHOD-OVERRIDE` header field if it is found. Returned string is upper case.
*
* @method getMethodActual
* @return {String} request method
*/
Request.prototype.getMethodActual = function() {
    return this._request.method;
};



/**
*  Get the mime type specified by the client
*
* @method getMimeType
* @return {String} mime type
*/
Request.prototype.getMimeType = function() {
    return this.get('Content-Type');
};




/**
*  Get the host port specified by the request header
*
* @method getPort
* @return {Number} Port Number
*/
Request.prototype.getPort = function() {
    if ( !this._port ) {
        var host = this.get( 'host' );
        var port = host.split( ':' )[ 1 ];
        /*
            If port is not specified in the `Host` request headr, port 80 is assumed.
        */    
        this._port = ( port >>> 0 ) || 80;
    }
    
    return this._port;
};



/**
*  Get the query portion of the requested URL.  i.e 'field=value'
*
* @method getQueryString
* @return {String} query string
*/
Request.prototype.getQueryString = function() {
    return this._queryString;
};



/**
*  Get the query portion of the requested URL as an object.  i.e 'field=value' becomes {'field': 'value'} 
*
* @method getQuery
* @return {Object} query
*/
Request.prototype.getQuery = function() {
    //return this._parsedUrl.query;
    return this._parsedUrl.query;
};




/**
*  Get the request scheme ('http' or 'https')  
*
* @method getScheme
* @return {String} scheme
*/
Request.prototype.getScheme = function() {
    return this.isSecure() ? 'https' : 'http';
};



/**
*  Check whether or not the requested method is a `safe` one (GET, HEAD).
*
* @method isMethodSafe
* @return {Boolean} is method safe
*/
Request.prototype.isMethodSafe = function() {
    var method = this.getMethod();
    if ( method === 'GET' || method === 'HEAD') {
        return true;
    } else {
        return false;
    }    
};



/**
*  Determaine whether the client has a no-cache policy
*
* @method isNoCache
* @return {Boolean} True if there is a no-cache policy otherwise false
*/
Request.prototype.isNoCache = function() {
    var pragma = this.get( pragma );
    if( typeof( pragma ) === 'string' ) {
        if ( pragma.indexOf( 'no-cache' ) != -1 ) {
            return true;
        }
    }
    return false;
};




/**
*  Determaine whether the connection to the client is secure
*
* @method isSecure
* @return {Boolean} is connection secure
*/
Request.prototype.isSecure = function() {
    if ( this._serverIsSecure ) {
        return true;
    } else if ( this._trustProxyData ) {
        var SSL_HTTPS = this.get( 'SSL_HTTPS' ) || '';
        var X_FORWARDED_PROTO = this.get( 'X_FORWARDED_PROTO' ).toLowerCase() || '';
        if ( SSL_HTTPS.toLowerCase() === 'on' || SSL_HTTPS == 1 || X_FORWARDED_PROTO === 'https' ) {
            return true;
        }
    }
    return false;
};



/**
*  Determaine whether the request is an AJAX/XHR request. It determines this by checking the X-Requested-With header.
*     The header is specified by the javascript framework. Works with Prototype, Mootools and jQuery.
*
* @method isXmlHttpRequest
* @return {Boolean} True if request is `AJAX` otherwise false
*/
Request.prototype.isXmlHttpRequest = function() {
    return ( this.get( 'X-Requested-With' ) || '' ).toLowerCase() === 'xmlhttprequest';
};



/**
*  Determaine whether the request is a websocket request. It determines this by checking the `Upgrade` header field.
*
* @method isWebSocketRequest
* @return {Boolean} True if request is a WebSocket upgrade request otherwise false
*/
Request.prototype.isWebSocketRequest = function() {
    var upgrades = this.getUpgrades();
    for ( var i = 0, len = upgrades.length; i < len; i++ ) {
        if ( upgrades[i] === 'WebSockets' ) {
            this._isWebSocket = true;
            break;
        }
    }
    return this._isWebSocket;
};



/**
*  Determine the HTTP protocol version in the client request.
*
* @method getVersion
* @return {Number} HTTP verions
*/
Request.prototype.getVersion = function() {
    return parseInt( this._request.httpVersion );
};




/**
* Returns a reference to the net.Socket object associated with the current connection
*
* @method getConnectionSocket
* @return {Object} Reference to the net.Socket object for current connection
*/
Request.prototype.getConnectionSocket = function() {
    return this._request.connection;
};



/**
* Returns the value for the Upgrade request header.
*
* @method getUpgrade
* @return {String} upgrade
*/
Request.prototype.getUpgrade = function() {
    return this._request.upgrade;
};



/**
* Set the encoding for the request body. 
*
* @method setEncoding
* @param {String|Null} encoding=null `utf8` or `binary`. Defaults to null,
            which means that the `data` event will emit a Buffer object
*/
Request.prototype.setEncoding = function( encoding ) {
    this._request.setEncoding( encoding );
};



/**
* Should Firefly trust data coming from a proxy. (i.e `HTTP_X_FORWARDED_FOR` header)
*
* @method trustProxyData
* @param {Boolean} trust Set true if you have any reverse proxys in front of your server. 
*/
Request.prototype.trustProxyData = function( trust ) {
    this._trustProxyData = trust;
};



/**
* Get the referrer URL
*
* @method getReferrer
* @return {String} referrer
*/
Request.prototype.getReferrer = function() {
    return this.get( 'Referer' ) || '';
};



/**
* Get the referrer URL. Same as <Referrer> but misspelled as it is in the specs
*
* @method getReferer
* @return {String} referrer
*/
Request.prototype.getReferer = Request.prototype.getReferrer;



/**
* Determine whether the client is sending a Do-Not-Track request header
*
* @method hasDoNotTrack
* @return {Boolean} true if the header exists, otherwise false
*/
Request.prototype.hasDoNotTrack = function() {
    return this.get( 'DNT' ) == 1 ? true : false;
};



/**
* Get the value of the `Connection` header field of client request
*
* @method getConnection
* @return {String} connection header value
*/
Request.prototype.getConnection = function() {
    return this.get( 'Connection' ) || '';
};



/**
* Get values of the `Upgrade` field of the request header
*
* @method getUpgrades
* @return {Array} values of the `Upgrade` header
*/
Request.prototype.getUpgrades = function() {
    if (this._request.length === 0) {
        var upgrade = this.get( 'Upgrade' ) || '';
        this._upgrade = upgrade.split(',');
        for ( var i = 0, len = this._upgrade.length; i < len; i++ ) {
            this._upgrade[i] = this._upgrade[i].trim();
        }
    }
    return this._upgrade;
};



/**
* Determine whether the client is asking for a protocol upgrade
*
* @method hasUpgrade
* @return {Boolean} true if upgrade field is set otherwise false
*/
Request.prototype.hasUpgrade = function() {
    return this.getConnection().toLowerCase() === 'upgrade' ? true : false;
};



/**
* Get the value of a specified HTTP request header
*
* @method get
* @return {String} Value of HTTP header
*/
Request.prototype.get = function( header ) {
    return this._request.headers[ (header || '').toLowerCase() ];
};



/**
* Get the value of a HTTP header as a Date object.. if it is a valid representaion of a date
*
* @method getHeaderDate
* @param {String} header Name of http header for which to get date value
* @param {Date} defaultValue Date object to be returned incase the specified HTTP header does not exist or is empty
* @return {Date} Requested date
*/
Request.prototype.getHeaderDate = function( header, defaultValue ) {
    var date = this.get( header );
    if ( !date ) {
        return defaultValue;
    }
    
    date = Date.parse( date );
    if ( isNaN( date ) ) {
        throw Error( '"name": "Bad  Date", "description": "Cannot parse malformed date representation"' );
    }
    
    return new Date( date );
};



/**
* Parse the cookies sent by the client and create a `Cookie` object for each of them
*
* @method _parseCookies
* @private
*/
Request.prototype._parseCookies = function() {
    var cookies = this.get( 'Cookie' ) || '';
    if (cookies.length) {
        cookies = cookies.split( ';' );
        for (var i = 0, len = cookies.length; i < len; i++ ) {
            
            cookies[i] = cookies[i].trim();
            var cookieParts = cookies[i].split( '=' );

            var cookie = cookieParts[ 1 ]
             
            //set the first part of the cookie, portion before the = as the cookie name
            this._cookies[ cookieParts[ 0 ] ] = cookie;
        }
    }
    
};



/**
* Get the specified cookie as a `Cookie` object
*
* @method getCookie
* @param {String} name Name of cookie
* @return {String} the value of the cookie
*/
Request.prototype.getCookie = function( name ) {
    return this._cookies[ name ];
};




/**
* Pause a client request. Calls native request.pause() method. Stops the request from
            emmiting any new events until `resume` is called. Usefull to make sure 
            events not be missed while performing IO operationa.
*
* @method pause
*/
Request.prototype.pause = function() {
    this._request.pause();
};




/**
* Resume a paused request
*
* @method resume
*/
Request.prototype.resume = function() {
    this._request.resume();
};



/**
* Set the reference to the route object for the request, useful for getting quick 
        access to the route object 
*
* @method setRouteObject
* @param {Object} route Reference to the route object
* @return {String} the value of the cookie
*/
Request.prototype.setRouteObject = function( route ) {
    this._routeObject = route;
};



/**
* Get a reference to the route object for the request, useful for getting
        quick access to the route object 
*
* @method getRouteObject
* @return {Object} reference to route object
*/
Request.prototype.getRouteObject = function() {
    return this._routeObject;
};



/**
* Set a reference to the applet object to which the Router has assigned this Request
*
* @method setApplet
* @param {Object} route Reference to the route object
* @return {Object} applet Reference to applet object
*/
Request.prototype.setApplet = function( applet ) {
    this._appletObject = applet;
};
 
 

/**
* Get a reference to the applet instance object this request is assigned to
*
* @method getApplet
* @return {Object} reference to applet object
*/
Request.prototype.getApplet = function() {
    return this._appletObject;
};


/**
* Get a reference to the form data sent with user request
*
* @method getFormData
* @return {Object} reference to form data object. Object contains properties `files` and `fields`
            Both are arrays
*/
Request.prototype.getFormData = function() {
    return this._formFields;
};


Request.prototype.setSession = function( session ) {
    this._session = session;
};


Request.prototype.getSession = function() {
    return this._session;
};