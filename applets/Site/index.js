'use strict';

var Site = module.exports = function( app ) {
	this._app = app;
};

Site.prototype.homeAction = function( request, response ) {
    response.setContent('MEW!!');
    response.send();
};

Site.prototype.loginAction = function(req, res) {
    res.render('login.html');
}

Site.prototype.registerAction = function(req, res) {
    res.render('register.html');
}


Site.prototype.profileAction = function(req, res) {
    res.render('profile.html');
}