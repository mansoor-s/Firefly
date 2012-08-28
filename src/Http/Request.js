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

let url = require('url');
let UserAgent = require( 'useragent' );
let Formidable = require('formidable');


/*
    Function: Request

        Request object constructor

    Parameters:

        req - Native node request object
*/
let Request = module.exports = function( req ) {
    this._isMethodSafe = false;
    this._trustProxyData = false;
    this._isWebSocket = false;
    this._charSets = [];
    this._upgrade = [];
    this._cookies = {};
    this._request = req;
    this._parsedUrl = url.parse( this._request.url, true );
    this._queryString = url.parse( this._request.url ).query;
    this._parseCookies();

    this._formData = {
        fields: [],
        files: []
    };
    
    this._routeObject = undefined;
};



/*
    Function: parseForm

    Parses form fields and files.

    Parameters:

        fn - {Functions} callback function to call when upload is finished and has been parsed
*/
Request.prototype.parseForm =  function(fn) {
    let form = new Formidable.IncomingForm();
    let self = this;
    form.parse( this._request, function( err, fields, files ) {
        self._formData.fields = fields || [];
        self._formData.files = files || [];
        fn();
    });
};

/*
    Function: setServerSecure

    Explicitly tell the Request object that the connection with the client is secure (HTTPS)
*/
Request.prototype.setServerSecure = function( secure ) {
    this._serverIsSecure = secure;
}; 



/*
    Function: _setupUserAgent

    Uses the Useragent package (https://github.com/3rd-Eden/useragent) to parse the 
    useragent header field
*/
Request.prototype._setupUserAgent = function() {
    let user_agent = this.get( 'user-agent' );
    this._userAgent = UserAgent.parser( user_agent );
};



/*
    Function: getOs

    Returns the client OS as specified in the user-agent header field

    Returns:

      {String} Client's OS
*/
Request.prototype.getOs = function() {
    if ( !this._userAgent ) {
        this._setupuserAgent();        
    }
    return this._userAgent.prettyOs();
};



/*
    Function: getBrowser

    Returns the client Browser and version as specified in the user-agent header field

    Returns:

      {String} Client's Browser and version
*/
Request.prototype.getBrowser = function() {
    if ( !this._userAgent ) {
        this._setupuserAgent();        
    }
    return this._userAgent.pretty();
};



/*
    Function: getClientIpAddress

    Finds the client's IP address
    
    Parameters:
        
        proxy - {Boolean} Boolean value indicating whether there is a proxy sitting infront of the server

    Returns:

      {String} Client's IP Address
*/
Request.prototype.getClientIpAddress = function( proxy ) {
    if ( proxy && this._trustProxyData ) {
        return this.get( 'HTTP_X_FORWARDED_FOR' );
    }
    return this._request.client.remoteAddress;
};



/*
    Function: getPort

    Finds the client's port number

    Returns:

      {Number} Client's port number
*/
Request.prototype.getPort = function() {
    return this._request.client.remotePort;
};



/*
    Function: getAcceptableContentTypes

    Get the content types acceptable to the client browser

    Returns:

      {Array} Client browser's acceptable content types
*/
Request.prototype.getAcceptableContentTypes = function() {
    
};



/*
    Function: getBasePath

    Get the base path of the request URI

    Returns:

      {String} Base path of the request URI
*/
Request.prototype.getBasePath = function() {
    return this._parsedUrl.pathname;
};


/*
    Function: getBaseUrl

    Get the base URL of the request URI

    Returns:

      {String} Base path of the request URI
*/
Request.prototype.getBaseUrl = function() {
    return this._parsedUrl.protocol + this._parsedUrl.host + this._parsedUrl.pathname;
};



/*
    Function: getCharsets

    Get the charsets supported by the client

    Returns:

      {Array} Charsets
*/
Request.prototype.getCharsets = function() {
    if (this._charSets === undefined) {
        this._charSets = this.get( 'Accept-Charset' ) || '';
    }
    return this._charSets;
};



/*
    Function: getETags

    Get the base ETags header

    Returns:

      {Array} ETags
*/
Request.prototype.getETags = function() {
    let etags = this.get( 'If-None-Match' ) || '';
    return etags.split( ',' );
};



/*
    Function: getFormat

    Get the format requested by the client

    Returns:

      {String} format
*/
Request.prototype.getFormat = function() {
    
};



/*
    Function: getHost

    Get the host header in the client request. If a port number is appended to the host, it will be omitted.
    This is the case if a non-standard port is used for the http servere.
    
    Returns:

      {String} host

    See Also:
    
        <getHttpHost>
*/
Request.prototype.getHost = function() {
    let host = this.get( 'host' );
    return host.split( ':' )[ 0 ];
};



/*
    Function: getHTTPHost

    Get the host header in the request. Includes the port port number if sent by the client.

    Returns:

      {String} host

    See Also:
    
        <getHost>
*/
Request.prototype.getHttpHost = function() {
    return this.get( 'host' );
};



/*
    Function: getLanguages

    Get the languages supported by the client by reading the 

    Returns:

      {Array} languages supported. If no no languages are specified, an empty array is returned

    See Also:
    
        <getPreferredLanguage>
*/
Request.prototype.getLanguages = function() {
    let languagesRaw = this._request.headers[ 'Accept-Language' ] || '';
    languagesRaw = languagesRaw.split( ',' );
    let languages = [];
    //return only the language identifier part and not the quality value
    for (let i = 0, len = languagesRaw.length; i < len; ++i) {
        let lang = languagesRaw[ i ].split( '' )[ 0 ];
        languages.push( lang );
    }
    
    return languages;
};



/*
    Function: getPreferredLanguage

    Get the prefered language for the client based on the language's quality value

    Returns:

      {String} prefered language

    See Also:
    
        <getLanguages>
*/
Request.prototype.getPreferredLanguage = function() {
    let languagesRaw = this._request.headers[ 'Accept-Language' ] || '';
    languagesRaw = languagesRaw.split( ',' );
    let preferredLanguage = '';
    
    let preferredValue = 0;
    for (let i = 0; i < languagesRaw.length; i++) {
        //if quality value is not specified the default value is 1
        let langValue = languagesRaw[ i ].split( '' )[ 1 ] || 1;
        if (langValue > preferredValue) {
            preferredValue = langValue;
            preferredLanguage = languagesRaw[ i ].split( '' )[ 0 ];
        }
        
    }
    
    return preferredLanguage;
};



/*
    Function: getMethod

    Get request method (i.e POST, GET, PUT..). If the X-HTTP-METHOD-OVERRIDE is found, it is returned instead.
    Returned string is capitalized.

    Returns:

      {String} request method
      
    See Also:
        <getMethodActual>
*/
Request.prototype.getMethod = function() {
    if ( !this._method ) {
        let method_override = this.get( 'X-HTTP-METHOD-OVERRIDE' );
        if ( this._request.method === 'POST' && typeof( method_override ) === 'string' ) {
            this._method = method_override.toUpperCase();
        } else {
            this._method = this._request.method;
        }
    }
    return this._method;
};



/*
    Function: getMethodActual

    Get request method. This is different from <getMethod> in that it will return the actual method used in the http request
    as apposed to returning the X-HTTP-METHOD-OVERRIDE header value if it is found. Returned string is capitalized.

    Returns:

      {String} request method
      
    See Also:
        <getMethod>
*/
Request.prototype.getMethodActual = function() {
    return this._request.method;
};



/*
    Function: getMimeType

    Get the mime type specified by the client

    Returns:

      {String} mime type
*/
Request.prototype.getMimeType = function() {
    
};




/*
    Function: getPort

    Get the host port specified by the request header

    Returns:

      {Number} Port Number
*/
Request.prototype.getPort = function() {
    if ( !this._port ) {
        let host = this.get( 'host' );
        let port = host.split( ':' )[ 1 ];
        /*
            If port is not specified in the `Host` request headr, port 80 is assumed.
        */    
        this._port = ( port >>> 0 ) || 80;
    }
    
    return this._port;
};



/*
    Function: getQueryString

    Get the query portion of the requested URL.  i.e 'name=ryan'

    Returns:

      {String} query string
      
    See Also:
        
        <getQuery>
*/
Request.prototype.getQueryString = function() {
    return this._queryString;
};



/*
    Function: getQuery

    Get the query portion of the requested URL as an object.  i.e 'name=ryan' becomes {'name': 'ryan'} 

    Returns:

      {Object} query
      
    See Also:
        
        <getQueryString>
*/
Request.prototype.getQuery = function() {
    //return this._parsedUrl.query;
    return this._parsedUrl.query;
};




/*
    Function: getScheme

    Get the request scheme ('http' or 'https') 

    Returns:

      {Boolean} is method safe
*/
Request.prototype.getScheme = function() {
    return this.isSecure() ? 'https' : 'http';
};



/*
    Function: isMethodSafe

    Check whether or not the requested method is a `safe` one (GET, HEAD).

    Returns:

      {Boolean} is method safe
*/
Request.prototype.isMethodSafe = function() {
    let method = this.getMethod();
    if ( method === 'GET' || method === 'HEAD') {
        return true;
    } else {
        return false;
    }    
};



/*
    Function: isNoCache

    Determaine whether the client has a no-cache policy

    Returns:

      {Boolean} is there a no-cache policy
*/
Request.prototype.isNoCache = function() {
    let pragma = this.get( pragma );
    if( typeof( pragma ) === 'string' ) {
        if ( pragma.indexOf( 'no-cache' ) != -1 ) {
            return true;
        }
    }
    return false;
};




/*
    Function: isSecure

    Determaine whether the connection to the client is secure

    Returns:

      {Boolean} is connection secure
*/
Request.prototype.isSecure = function() {
    if ( this._serverIsSecure ) {
        return true;
    } else if ( this._trustProxyData ) {
        let SSL_HTTPS = this.get( 'SSL_HTTPS' ) || '';
        let X_FORWARDED_PROTO = this.get( 'X_FORWARDED_PROTO' ).toLowerCase() || '';
        if ( SSL_HTTPS.toLowerCase() === 'on' || SSL_HTTPS == 1 || X_FORWARDED_PROTO === 'https' ) {
            return true;
        }
    }
    return false;
};



/*
    Function: isXmlHttpRequest

    Determaine whether the request is an AJAX/XHR request. It determines this by checking the X-Requested-With header.
    The header is specified by the javascript framework. Works with Prototype, Mootools and jQuery.

    Returns:

      {Boolean} is request AJAX
*/
Request.prototype.isXmlHttpRequest = function() {
    return ( this.get( 'X-Requested-With' ) || '' ).toLowerCase() === 'xmlhttprequest';
};



/*
    Function: isWebSocketRequest

    Determaine whether the request is a websocket request. It determines this by checking the `Upgrade` header field.

    Returns:

      {Boolean} is request WebSocket
*/
Request.prototype.isWebSocketRequest = function() {
    let upgrades = this.getUpgrades();
    for ( let i = 0, len = upgrades.length; i < len; i++ ) {
        if ( upgrades[i] === 'WebSockets' ) {
            this._isWebSocket = true;
            break;
        }
    }
    return this._isWebSocket;
};



/*
    Function: getVersion

    Determine the HTTP protocol version in the client request.

    Returns:

      {Number} HTTP verions
*/
Request.prototype.getVersion = function() {
    return parseInt( this._request.httpVersion );
};



/*
    Function: getConnectionSocket

    Returns the net.Socket object associated with the current connection

    Returns:

      {Object} net.Socket for current connection
*/
Request.prototype.getConnectionSocket = function() {
    return this._request.connection;
};



/*
    Function: verifyPeer

    Returns the net.Socket object associated with the current connection

    Returns:

      {Object} net.Socket for current connection
*/
Request.prototype.verifyPeer = function() {
    return this._request.connection.verifyPeer();
};



/*
    Function: getPeerCertificate

    Returns the net.Socket object associated with the current connection

    Returns:

      {Object} net.Socket for current connection
*/
Request.prototype.getPeerCertificate = function() {
    return this._request.connection.getPeerCertificate();
};



/*
    Function: getUpgrade

    Returns the value for the Upgrade request header.

    Returns:

      {String} upgrade
*/
Request.prototype.getUpgrade = function() {
    return this._request.upgrade;
};



/*
    Function: setEncoding

    Set the encoding for the request body. 
    
    Parameters:
        
        encoding - {String|Null} Encoding name. `utf8` or `binary`. Defaults to null,
            which means that the `data` event will emit a Buffer object
*/
Request.prototype.setEncoding = function( encoding ) {
    this._request.setEncoding( encoding );
};



/*
    Function: trustProxyData

    Should Firefly trust data coming from a proxy. (i.e `HTTP_X_FORWARDED_FOR` header)
    
    Parameters:
        
        trust - {Boolean} Set true if you have any reverse proxys in front of your server. 
*/
Request.prototype.trustProxyData = function( trust ) {
    this._trustProxyData = trust;
};



/*
    Function: getReferrer

    Get the referrer URL.
    
    returns:
        
        {String} referrer
        
    See Also: 
    
        <getReferer>
*/
Request.prototype.getReferrer = function() {
    return this.get( 'Referer' ) || '';
};



/*
    Function: getReferer

    Get the referrer URL. Same as <Referrer> but misspelled
    
    returns:
        
        {String} referrer
        
    See Also: 
    
        <getReferrer>
*/
Request.prototype.getReferer = Request.prototype.getReferrer;



/*
    Function: hasDoNotTrack

    Determine whether the client is sending a Do-Not-Track request header
    
    returns:
        
        {Boolean} true if the header exists, otherwise false
*/
Request.prototype.hasDoNotTrack = function() {
    return this.get( 'DNT' ) == 1 ? true : false;
};



/*
    Function: getConnection

    Get the value of the `Connection` header field of client request
    
    returns:
        
        {String} a string containing the Connection header value
*/
Request.prototype.getConnection = function() {
    return this.get( 'Connection' ) || '';
};



/*
    Function: getUpgrades

    Get value/s of the `Upgrade` field of the request header
    
    returns:
        
        {Array} values of the `Upgrade` header
*/
Request.prototype.getUpgrades = function() {
    if (this._request.length === 0) {
        let upgrade = this.get( 'Upgrade' ) || '';
        this._upgrade = upgrade.split(',');
        for ( let i = 0, len = this._upgrade.length; i < len; i++ ) {
            this._upgrade[i] = this._upgrade[i].trim();
        }
    }
    return this._upgrade;
};



/*
    Function: hasUpgrade

    Determine whether the client is asking for a protocol upgrade
    
    returns:
        
        {Boolean} a string containing the Connection header value
*/
Request.prototype.hasUpgrade = function() {
    return this.getConnection().toLowerCase() === 'upgrade' ? true : false;
};



/*
    Function: getTransport

    Determine the transport used by client to make the request (i.e XHR, WS, HTTP)
    
    returns:
        
        {Boolean} a string containing the Connection header value
*/
Request.prototype.getTransport = function() {
    if ( !this._transport ) {
        if ( this.isXmlHttpRequest() ) {
            this._transport = 'XHR';
        } else if ( this.isWebSocketRequest() ) {
            this._transport = 'WS';
        } else {
            this._transport = 'HTTP';
        }
    }
    
    return this._transport;
};



/*
    Function: get

    Get the value of a specified HTTP request header
    
    returns:
        
        {String} Value of HTTP header
*/
Request.prototype.get = function( header ) {
    return this._request.headers[ (header || '').toLowerCase() ];
};



/*
    Function: getHeaderDate

        Get the value of a HTTP header as a Date object.. if it is a valid representaion of a date
        
    Parameters:
    
        header - {String} Name of http header for which to get date value
        defaultValue - {Date} Date object to be returned incase the specified HTTP header does not exist or is empty
    
    returns:
    
        {Date} Requested date
*/
Request.prototype.getHeaderDate = function( header, defaultValue ) {
    let date = this.get( header );
    if ( !date ) {
        return defaultValue;
    }
    
    date = Date.parse( date );
    if ( isNaN( date ) ) {
        throw Error( '"name": "Bad  Date", "description": "Cannot parse malformed date representation"' );
    }
    
    return new Date( date );
};




/*
    Function: _parseCookies

        Parse the cookies sent by the client and create a `Cookie` object for each of them

*/
Request.prototype._parseCookies = function() {
    let cookies = this.get( 'Cookie' ) || '';
    if (cookies.length) {
        cookies = cookies.split( ';' );
        for (let i = 0, len = cookies.length; i < len; i++ ) {
            
            cookies[i] = cookies[i].trim();
            let cookieParts = cookies[i].split( '=' );

            let cookie = cookieParts[ 1 ]
             
            //set the first part of the cookie, portion before the = as the cookie name
            this._cookies[ cookieParts[ 0 ] ] = cookie;
        }
    }
    
};



/*
    Function: getCookie

        Get the specified cookie as a `Cookie` object
        
    Parameters:
        
        name - {String} Name of cookie
        
    Returns:
    
        {String} the value of the cookie
*/
Request.prototype.getCookie = function( name ) {
    return this._cookies[ name ].getValue();
};




/*
    Function: pause
    
        Pause a client request. Calls native request.pause() method. Stops the request from
            emmiting any new events until `resume` is called. Usefull to make sure 
            events not be missed while performing IO operationa.
*/
Request.prototype.pause = function() {
    this._request.pause();
};




/*
    Function: resume
    
        Resume a paused request
*/
Request.prototype.resume = function() {
    this._request.resume();
};



/*
    Function: setRouteObject
    
        Set the refrence to the route object for the request, useful for getting quick 
        access to the route object 
        
    Parameters:
        route - {Object} refrence to the route object
*/
Request.prototype.setRouteObject = function( route ) {
    this._routeObject = route;
};



/*
    Function: getRouteObject
    
        Get a refrence to the route object for the request, useful for getting
        quick access to the route object 
        
    Returns: 
        {Object} refrence to route object
*/
Request.prototype.getRouteObject = function() {
    return this._routeObject;
};


/*
    Function: setApplet
    
        Set a refrence to the applet object that the Router has assigned this Request to 
        
    Parameters:
        applet - {Object} refrence to applet object
*/
Request.prototype.setApplet = function( applet ) {
    this._appletObject = applet;
};
 
 

/*
    Function: getApplet
    
        Get a refrence to the applet instance object this request is assigned to
                
    Returns: 
        {Object} refrence to applet object
*/
Request.prototype.getApplet = function() {
    return this._appletObject;
};

/*
    Function: getFormData
    
        Get a refrence to the form data sent with user request
                
    Returns: 
        {Object} refrence to form data object. Object contains properties `files` and `fields`
            Both are arrays
*/
Request.prototype.getFormData = function() {
    return this._formData;
};   