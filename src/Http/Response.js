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

var Cookie = require( './Cookie.js' );


/**
* Response object constructor
*
* @class Response
* @module Core
* @constructor
* @param {Object} res Native node response object
*/
var Response = module.exports = function( resNative, fReq, firefly ) {
    this._response = resNative;
    this._request = fReq;
    this._firefly = firefly;
    
    this._cookies = {};
    //default content type
    this._contentType = 'text/html';
    
    this._cacheControl = {};
    
    this._encoding = 'utf8';
    
    this._charset = 'UTF-8';
    
    this._response.statusCode = 200;
    
    this._sent = false;
};



/**
* Creates a string represnetaion of the response object including both 
*            content and header sections. **This is broken**
*
* @method toString
* @param {String} String representation of HTTP response
*/
Response.prototype.toString = function() {
    return JSON.stringify( this._response );
};



/**
* Exposes the native Node response object
*
* @method getNativeResponse
* @param {Object} Native Node esponse object
*/
Response.prototype.getNativeResponse = function() {
    return this._response;    
};



/**
* Get age of the response
*
* @method getAge
* @return {Number | undefined} Header's value as a type Number, if none is found 
*           then `undefined` is returned
*/
Response.prototype.getAge = function() {
    var age;
    if ( this.get( 'Age' ) !== undefined ) {
        age = this.get( 'Age' ) >> 0;
    }
    return age;
};



/**
* Get the name of the encoding
*
* @method getEncoding
* @return {String} encoding
*/
Response.prototype.getEncoding = function() {
    return this._encoding;
};



/**
* Change the value of the response's encoding, default is `utf8`
*
* @method setEncoding
* @return {String} encoding to use
*/
Response.prototype.setEncoding = function( encoding ) {
    this._encoding = encoding;
};



/**
* Get content of the response object
*
* @method getContent
* @return {String} Content of response object
*/
Response.prototype.getContent = function() {
    return this._content;
};


/**
* Set the value of the `Date` HTTP header
*
* @method setDate
* @param {Date} date Value to set as the value of `Date` header
*/
Response.prototype.setDate = function( date ) {
    this.setHeaderDate( date);
};



/**
* Get a Date object with the value of the `Date` HTTP header
*
* @method getDate
* @return {Date} value of `Date` header
*/
Response.prototype.getDate = function() {
    return this.getHeaderDate( 'Date' );
};



/**
* Get the value of a HTTP header as a Date object.. if it is a valid representaion of a date
*
* @method getHeaderDate
* @param {String} header Name of http header for which to get date value
* @param {Date} defaultValue Date object to be returned incase the specified HTTP header
            does not exist or is empty
* @return {Date} Requested date
*/
Response.prototype.getHeaderDate = function( header, defaultValue ) {
    var date = this.get( header );
    if ( !date ) {
        return defaultValue;
    }
    date = Date.parse( date );
    if ( isNaN( date ) ) {
        throw Error( 'name: "Bad  Date", description: "Cannot parse malformed date representation"' );
    }
    
    return new Date( date );
};



/**
* Set the value of the specified header to the value of the specified Date object (UTC representation)
*
* @method setHeaderDate
* @param {String} header Name of header field
* @param {Date} data date value
* @return {Date} value of `Date` header
*/
Response.prototype.setHeaderDate = function( header, date ) {
    this.setHeader( header, date.toUTCString() );
};



/**
* Get the value of the Etag header value
*
* @method getEtag
* @return {String} value of `Etag` HTTP header
*/
Response.prototype.getEtag = function() {
    return this.getHeader( 'Etag' );
};



/**
* Get the value of the `Expires` header as a Date object
*
* @method getExpires
* @return {Date} Response expiration date
*/
Response.prototype.getExpires = function() {
    return this.getHeaderDate( 'Expires' );
};



/**
* Get the maximum time after which the response will be considered stale as a Date object.
*           First, it checks for a `s-maxage` directive, then a `max-age` directive, and then it falls
*           back on an `expires` header. `undefined` is returned when no maximum age can be established.
*
* @method getMaxAge
* @return {String} String representation of HTTP response
*/
Response.prototype.getMaxAge = function() {
    var age;
    if ( (age = getCacheControlDirective('s-maxage')) !== null ) {
        return age;    
    }
    
    if ( (age = getCacheControlDirective( 'max-age' )) !== null ) {
        return age;
    }
    
    return this.getExpires();
};




/**
* Get the response's HTTP status code
*
* @method getStatusCode
* @return {Number} Status code
*/
Response.prototype.getStatusCode = function() {
    return this._response.statusCode;
};




/**
* Get the lety HTTP header's values in an array 
*
* @method getlety
* @return {Array} lety values
*/
Response.prototype.getlety = function() {
    var lety = this.get( 'lety' ) || '';

    return lety.split( ', ' );
};



/**
* Set the `lety` header
*
* @method setlety
* @param {Array | String} headers An Array or String containing list of headers.
            if it is a string then the headers must be comma seperated
*/
Response.prototype.setlety = function( headers ) {
    this.set( 'lety', headers.join( ', ' ) );
};



/**
* Determin if the response is cachable
*
* @method isCachable
* @return {Boolean} is response cachable
*/
Response.prototype.isCachable = function() {
    
};



/**
* Determine if the response is fresh
*
* @method isFresh
* @return {Boolean} True if it is fresh, otherwise false
*/
Response.prototype.isFresh = function() {
    return this.getTtl > 0;
};



/**
* Determine if the response includes headers that can be used to validate
*            the response with the origin server using a conditional GET request.
*
* @method isValidateable
* @return {Boolean} True if response is validateable otherwise, false
*/
Response.prototype.isValidateable = function() {
    if ( this.getHeader( 'Last-Modified' )  !== undefined || this.getHeader( 'ETag' ) !== undefined ) {
        return true;
    } else {
        return false;
    }
};



/**
* Set the time to live for the Response's private cache. This method sets the 
*           Cache-Control and max-age directives
*
* @method setClientTtl
* @param {Number} seconds Set the number of seconds (added to the existing age) should 
            the private TTL be set to 
*/
Response.prototype.setPrivateTtl = function( seconds ) {
    var age = this.getAge() >>> 0;
    this.setMaxAge( age + seconds );
};


/**
* Set the time to live for the Response's shared cache. This method sets the 
*           Cache-Control and s-maxage directives
*
* @method setTtl
* @param {Number} seconds Set the number of seconds (added to the existing age) 
            should the shared TTL be set to 
*/
Response.prototype.setTtl = function( seconds ) {
    var age = this.getAge() >>> 0;
    this.setSharedMaxAge( age + seconds );
};



/**
* Set the response content
*
* @method setContent
* @param {String} content String containing content
*/
Response.prototype.setContent = function( content ) {
    this._content = content;
};



/**
* Set the ETag header
*
* @method setEtag
* @param {String} value value to be set for the ETag header
* @param {Bool} weak boolean value indicating it is a weak Etag
*/
Response.prototype.setETag = function( value, weak ) {
    if ( value === undefined ) {
        this.removeHeader( 'Etag' );    
    } else {
        if ( value[0] !== '"' ) {
            value = '"' + value + '"';
        }
        if ( weak === true ) {
            value = 'W/' + value;
        }
        
        this.setHeader( 'Etag', value)
    }
};




/**
* Set the vlaue of the `Expires` HTTP header.
*
* @method setExpires
* @param {Date} date Date object containing the time value to be set
*/
Response.prototype.setExpires = function( date ) {
    if ( date === undefined ) {
        this.removeHeader( 'Expires' );
    } else {
        this.setHeaderDate( 'Expires', date );
    } 
};



/**
* Marks the response stale by setting the Age header to be equal to the maximum age of the response.
*
* @method setExpired
*/
Response.prototype.setExpired = function() {
    if ( this.isFresh() ) {
        this.set( 'Age', this.getMaxAge() );
    }
};



/**
* Set the value of the `Last-Modified` HTTP header with the specified Date object
*
* @method setLastModified
* @param {Date} date Instance of Date object holding date-time to be set as the last modified header
*/
Response.prototype.setLastModified = function( date ) {
    if ( !date ) {
        this.remove( 'Last-Modified' );
    } else {
        this.setHeaderDate( 'Last-Modified', date );
    }
};




/**
* Sets the number of seconds after which the response should no longer be considered fresh
*
* @method setMaxAge
* @param {Number} seconds Number of seconds
*/
Response.prototype.setMaxAge = function( seconds ) {
    this.addCacheControlDirective( 'max-age', seconds );
};




/**
* Sets the number of seconds after which the response should no longer be 
            considered fresh by shared caches.
            This methods sets the Cache-Control s-maxage directive.
*
* @method setSharedMaxAge
* @param {Number} seconds Number of seconds
*/
Response.prototype.setSharedMaxAge = function( seconds ) {
    this.setPublic();
    this.addCacheControlDirective( 's-maxage', seconds );
};



/*
    Function: 

        
*/
/**
* Set the response as a not modified (304). Will remove any HTTP headers that 
        might contradict this: 'Allow', 'Content-Encoding', 'Content-Language',
        'Content-Length', 'Content-MD5', 'Content-Type', 'Last-Modified'
*
* @method setNotModified
*/
Response.prototype.setNotModified = function() {
    this.setStatusCode( 304 );
    this.setContent( '' );
    
    var headersNotAllowed = [ 'Allow', 'Content-Encoding', 'Content-Language',
        'Content-Length', 'Content-MD5', 'Content-Type', 'Last-Modified' ];
    for ( var i = 0, len = headersNotAllowed.length; i < len; i ++) {
        this._response.removeHeader( headersNotAllowed[i] );
    }
};



/**
* Set reponse as private. This makes the response ineligible for serving other clients.
*
* @method setPrivate
*/
Response.prototype.setPrivate = function() {
    this.removeCacheControlDirective( 'public' );
    this.addCacheControlDirective( 'private' );
};



/**
* Set reponse as public. This makes the response eligible for serving other clients.
*
* @method setPublic
*/
Response.prototype.setPublic = function() {
    this.removeCacheControlDirective( 'private' );
    this.addCacheControlDirective( 'public' );
};



/*
* Set the protoccol version of the response
*
* method setProtocolVersion
*/
/*
Response.prototype.setProtocolVersion = function() {
    
};
*/


/**
* Set HTTP status code to response
*
* @method setStatusCode
* @param {Number} status Status code
*/
Response.prototype.setStatusCode = function( status ) {
    this._response.statusCode = status;
};



/**
* Send headers + content to client thus ending the client's request
*
* @method send
*/
Response.prototype.send = function() {
    //setup response cookies
    var cookies = [];
    for ( var cookie in this._cookies ) {
        cookies.push( this._cookies[ cookie ].toString() );
    }
    
    if ( cookies.length > 0 ) {
        this._response.setHeader('Set-Cookie', cookies);
    }
    
    this._response.setHeader('Content-Type', this._contentType);
    this._response.end( this._content, this._encoding );
    
    this._sent = true;
};



/**
* Send headers + content to client thus ending the client's request
*
* @method send
*/
Response.prototype.write = function( chunk, encoding ) {

    //setup response cookies
    var cookies = [];
    for ( var cookie in this._cookies ) {
        cookies.push( this._cookies[ cookie ].toString() );
    }
    
    if ( cookies.length > 0 ) {
        this._response.setHeader('Set-Cookie', cookies);
    }
    
    this._response.setHeader('Content-Type', this._contentType);
    this._response.end( this._content, this._encoding );
    
    
    this._response.write(chunk, this._encoding);
};

Response.prototype.end = function() {
    
};



/**
* Get the value of the `Cache-Control` header
*
* @method _getCacheControlHeader
* @private
* @return {String} Cache-Control header value
*/
Response.prototype._getCacheControlHeader = function() {
    var parts = [];
    for ( var directive in this._cacheControl ) {
        var value = this.cacheControl[ directive ];
        if ( value === true ) {
            parts.push( directive );
        } else {
            if( /[^a-zA-Z0-9._-]/.test( value ) ) {
                value = '"' + value + '"';
            }
            parts.push( directive + '=' + value );
        }
    }
    
    return parts.join(', ');
};



/**
* Add a cache directive to `Cache-Control` header
*
* @method addCacheControlDirective
* @param {String} directie Directive
* @param {String} [value] Optional value for cache directive
*/
Response.prototype.addCacheControlDirective = function( directive, value ) {
    if ( value === undefined ) {
        value = true;
    }
    this._cacheControl[ directive ] = value;
    
    this._updateCacheControl();
};



/**
* Remove a cache directive to `Cache-Control` header
*
* @method removeCacheControlDirective
* @param {String} directie name of directive to remove form header
*/
Response.prototype.removeCacheControlDirective = function( directive ) {
    delete this._cacheControl[ directive ];
    
    this._updateCacheControl();
};



/**
* Get a cache directive to `Cache-Control` header
*
* @method getCacheControlDirective
* @param {String} directie name of directive to remove form header
* @return {String} Value of specified directive
*/
Response.prototype.getCacheControlDirective = function( directive ) {
    return this._cacheControl[ directive ];
};



/**
* Updates the `Cache-Control` header to user specified properties using Response's methods 
*
* @method _updateCacheControl
* @private
* @param {String} directie name of directive to remove form header
* @return {String} Value of specified directive
*/
Response.prototype._updateCacheControl = function() {
    this.set( 'Cache-Control', this._getCacheControlHeader() );
};




/**
* Determines if the Response validators (ETag, Last-Modified) matches a conditional 
            value specified in the Request. If the response is not modified, it sets the 
            status code to 304 and removes the response content by calling the `setNotModified` method
*
* @method isNotModified
* @return {Boolean} True if the request and response cache validators match, otherwise false
*/
Response.prototype.isNotModified = function() {
    var lastModified = this._request.get( 'If-Modified-Since' );
    var notModified = false;
    var etag = this._request.getEtag();
    
    if ( !etag ) {
        notModified = ( ~etags.indexOf( this.getEtag() ) || ~etags.indexOf( '*' ) ) && ( !lastModified || this.getDate( 'Last-Modified' ).valueOf() === lastModified.valueOf() );
    } else if ( lastModified ) {
        notModified = lastModified.valueOf() === this.get( 'Last-Modified' ).valueOf();
    }
    
    if ( setNotModified ) {
        this.setNotModified();
    }
    
    return notModified;
};



/**
* Determine if the response is invalid by looking at the status code
*
* @method isInvalid
* @return {Boolean} true if the response is invalid, otherwise false
*/
Response.prototype.isInvalid = function() {
    return this.statusCode() < 100 || this.statusCode() >= 600;
};



/**
* Determine if the response is just informative by looking at the status code
*
* @method isInformational
* @return {Boolean} true if the response is informative, otherwise false
*/
Response.prototype.isInformational = function() {
    return this.statusCode() >= 100 && this.statusCode() < 200;
};



/**
* Determine if the response is successful by looking at the status code
*
* @method isSuccessful
* @return {Boolean} true if the response is successful, otherwise false
*/
Response.prototype.isSuccessful = function() {
    return this.statusCode() >= 200 && this.statusCode() < 300;
};



/**
* Determine if the response is a redirect by looking at the status code
*
* @method isRedirection
* @return {Boolean} true if the response is a redirect, otherwise false
*/
Response.prototype.isRedirection = function() {
    return this.statusCode() >= 300 && this.statusCode() < 400;
};


/**
* Determine if the response is a client error by looking at the status code
*
* @method isClientError
* @return {Boolean} true if the response is a client error, otherwise false
*/
Response.prototype.isClientError = function() {
    return this.statusCode() >= 400 && this.statusCode() < 500;
};



/**
* Determine if the response is a server error by looking at the status code
*
* @method isServerError
* @return {Boolean} true if the response is a server error, otherwise false
*/
Response.prototype.isServerError = function() {
    return this.statusCode() >= 500 && this.statusCode() < 600;
};



/**
* Determine if the response is OK by looking at the status code (200)
*
* @method isOk
* @return {Boolean} true if the response is OK, otherwise false
*/
Response.prototype.isOk = function() {
    return this.statusCode() === 200;
};



/**
* Determine if the response is forbidden by looking at the status code
*
* @method isForbidden
* @return {Boolean} true if the response is forbidden, otherwise false
*/
Response.prototype.isForbidden = function() {
    return this.statusCode() === 403;
};



/**
* Determine if the response is a `not found` by looking at the status code (404)
*
* @method isNotFound
* @return {Boolean} true if the response is 'not found', otherwise false
*/
Response.prototype.isNotFound = function() {
    return this.statusCode() === 404;
};


/**
* Determine if the response is empty by looking at the status code
*
* @method isEmpty
* @return {Boolean} true if the response is valid, otherwise false
*/
Response.prototype.isEmpty = function() {
    return ( this.statusCode() === 201 || this.statusCode() === 204 || this.statusCode() === 304 );
};




/**
* Set HTTP header and it's value
*
* @method set
* @param {String} header HTTP Header name
* @param {String} value Header value
*/
Response.prototype.set = function( header, value ) {
    this._response.setHeader( header, value );
};




/**
* Get the specified HTTP header's value
*
* @method get
* @param {String} header HTTP Header name
* @return {String} Specified Header's value
*/
Response.prototype.get = function( header ) {
    return this._response.getHeader( header );
};



/**
* Remove the specified HTTP header
*
* @method remove
* @param {String} header HTTP Header name
*/
Response.prototype.remove = function( header ) {
    this._response.removeHeader( header );
};




/**
* Set a cookie by passing in its properties, including it's name. 
            see <Cookie> for the supported properties
*
* @method addCookie
* @param {Object} Properties/directives of the cookie
*/
Response.prototype.addCookie = function( properties ) {
    if ( !properties.name ) {
        throw Error( 'name: "Bad Cookie", description: "Function requires valid cookie name"' );
    }
    this._cookies[ properties.name ] = new Cookie( properties );
};



/**
* Get the specified cookie as a `Cookie` object
*
* @method getCookie
* @param {String} name Name of cookie
* @return {Object/Cookie} requested cookie
*/
Response.prototype.getCookie = function( name ) {
    return this._cookies[ name ];
};



/**
* Remove a cookie from client browser by setting its `Expires` directive
*
* @method removeCookie
* @param {String} name Name of cookie
*/
Response.prototype.removeCookie = function( name ) {
    if ( !name ) {
        throw Error( 'name: "Bad Cookie", description: "Function requires valid cookie name"' );
    }

    var cookie;
    if ( this._cookies[name] ) {
        cookie = this._cookies[name];
        cookie.setValue('');
    } else {
        cookie = new Cookie({name: name, value: ''});
    }

    cookie.setExpires(new Date(0));
};



/**
* Render the response and end it
*
* @method render
* @param {String} viewName Name of the view to render
* @param {Object} props Object holding values to pass to rendering engine
*/
Response.prototype.render = function( viewName, props ) {
    var applet = this._request.getApplet();
    var content = this._firefly.renderer.render( applet, viewName, props );
    this.setContent( content );
    this.send();
};



/**
* Set response `Content-Type` header's value. firefly, by default sets it to text/html
*
* @method setContentType
* @param {String} contentType Value of Content-Type header
*/
Response.prototype.setContentType = function( contentType ) {
    this._contentType = contentType;
};



/**
* Get response `Content-Type` header's value
*
* @method getContentType
* @param {String} contentType Value of Content-Type header
*/
Response.prototype.getContentType = function() {
    return this._contentType;
};



/**
* Redirect user to another URL
*
* @method redirect
*/
Response.prototype.redirect = function( url ) {
    this.setStatusCode(303);
    this._response.setHeader('Location', url);
    this.setContent('');
    this.send();
};

//TODO: upgrade to TLS headers