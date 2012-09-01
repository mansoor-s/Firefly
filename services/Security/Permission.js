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

var bcrypt = require('bcrypt');

var Permission = module.exports = function(app) {
    this._app = app;
    this._cookieName = app.config.SESSION_COOKIE_NAME;
    app.addInitDependency(this._onInit());
    
    app.router.addRouteRequirement('authenticated', this._getAuthenticatedChecker());
    app.router.addRouteRequirement('verified', this._getVerifiedChecker());
    app.router.addRouteRequirement('group', this._getGroupChecker());

    
    this.sessionManager = app.get('SessionManager');
};

/*
    This is called after a session manager is created.

*/
Permission.prototype._onInit = function() {
    var self = this;
    return function(fn) {
        fn();
    };
};


Permission.prototype._getAuthenticatedChecker = function() {
    var self = this;

    return function(request, response, rule, fn) {
        self.hasValidSession(request, function(isValid) {
            if (isValid === true && rule === true) {
                fn(true, false);
            } else if (isValid === false && rule === false) {
                fn(true, false);
            } else {
                response.redirect('/user/login');
                fn(false, true);
            }
        });
    };
};




Permission.prototype._getVerifiedChecker = function() {
    var self = this;
    //fn takes  ruleSatisfied and end
    return function(request, response, rule, fn) {
        self.hasValidSession(request, function(isValid, session) {
            var verified;
            if(isValid === true) {
                verified = session.verified;
                if (verified === true && rule === true) {
                    fn(true, false);
                } else if (verified === false && rule === false) {
                    fn(true, false);
                } else {
                    //redirect insuficient privilages
                    fn(false, true);
                }
            } else {
                //redirect insuficient privilages
                fn(false, true)
            }
        });
    };
};


/*


*/
Permission.prototype.hasValidSession = function(request, fn) {
    var sessId = request.getCookie(self._cookieName);

    if (sessId) {
        fn(false)
    } else {
        this.sessionManager.getSession(request, function(session) {
            if (session) {
                fn(true, session);
            } else {
                fn(false);
            }
        });
    }
};