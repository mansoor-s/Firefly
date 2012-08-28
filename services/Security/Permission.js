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

let bcrypt = require('bcrypt');

let Permission = module.exports = function(app) {
    this._app = app;
    app.addInitDependency(this._onInit());
    
    //app.router.addRouteRequirement('Permissiond', this._getPermissiondChecker());
    app.router.addRouteRequirement('group', this._getGroupChecker());
    app.router.addRouteRequirement('userType', this._getUserTypeChecker());

    
    this.sessionStore = app.get('SessionStore');

};

/*
    This is called after a session manager is created.

*/
Permission.prototype._onInit = function() {
    let self = this;
    return function(fn) {
        fn();
    };
};


Permission.prototype._getPermissiondChecker = function() {
    let self = this;
    //fn takes  ruleSatisfied and end
    return function(request, response, rule, fn) {
        console.log('in _getPermissiondChecker');

        if (rule === false) {
            fn(true, false);
        } else {
            let sessionCookie = request.getCookie(self._app.config.SESSION_COOKIE_NAME);
            if (!sessionCookie) {
                response.redirect('/user/login');
                fn(false, true);
            } else {
                let sessionKey = sessionCookie.getValue();
                if (!sessionKey) {
                    response.redirect('/user/login');
                    fn(false, true);
                } else {
                    let session = self.sessionStore[sessionKey];

                    if (!session) {
                        response.redirect('/user/login');
                        fn(false, true);
                    } else {
                        fn(true);
                    }
                }
            }
        }
    };
};

Permission.prototype._getAccessLevelChecker = function() {
    let self = this;
    //fn takes  ruleSatisfied and end
    return function(request, response, rule, fn) {

    };
};

Permission.prototype._getUserTypeChecker = function() {
    let self = this;
    //fn takes  ruleSatisfied and end
    return function(request, response, rule, fn) {

    };
};