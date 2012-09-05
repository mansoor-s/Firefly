'use strict';

var Site = module.exports = function( app ) {
	this._app = app;
        this._mongoose = app.get('Mongoose');
        
        this._userModel = this._mongoose.model('User');
};

Site.prototype.homeAction = function( request, response ) {
    response.setContent('MEW!!');
    response.send();
};

Site.prototype.loginAction = function(req, res) {
    if (req.getMethod() === 'POST') {
        var fields = rq.getFormData().fields;
        
        if (!this.fieldsExist(fields, ['username', 'password'])) {
            res.render('login.html', {error: 'Incorrect credentials'});
            return;
        }
        
        var userName = fields.username;
        var password = fields.password;
        
        this._userModel.findOne({'username': userName}, function(err, user) {
            if (err) {
                console.log('There was an error!!');
                console.log(err);
                return;
            } 
            
            if (!user) {
                res.render('login.html', {error: 'Incorrect credentials'});
                return;
            }
            
            user.authenticate(password, function(result) {
                if (result === false) {
                    res.render('login.html', {error: 'Incorrect credentials'});
                } else {
                    //auth successful redirect to referrer. if it exists, otherwise
                    //go to homepage
                    res.redirect(request.getReferrer() || '/')
                }
            });
        });
    } else {
        res.render('login.html');
    }
    
}

Site.prototype.fieldsExist = function(fields, fieldNames) {
    var len = fieldNames.length;
    for (var i = 0; i < len; ++i) {
        var name = fieldNames[i];
        if (fields[name] === undefined) {
            return false;
        }
    }
    return true;
};

Site.prototype.registerAction = function(req, res) {
    if (this.req.getMethod() === 'POST') {
        var fields = req.getFormData().fields;
        var fieldNames = [
            'username',
            'password',
            'displayName',
            'email'
        ];
        
        if (!this.fieldsExist(fields, fieldNames)) {
            res.render('register.html', {'error': 'Fields not filled out!'});
        }
        
        var user = new this._userModel({
            'username': fields.username,
            'password': fields.password,
            'displayName': fields.displayName,
            'email': fields.email
        });
        
        user.save(function(err) {
            if(err) {
                res.render('register.html', {'error': 'Something went wrong..'});
            } else {
                res.redirect(request.getReferrer() || '/');
            }
        });
        
    } else {
        res.render('register.html');
    }
    
}


Site.prototype.profileAction = function(req, res) {
    res.render('profile.html');
}