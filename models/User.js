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

let bcrypt = require('bcrypt'),
	Schema = require('mongoose').Schema;

let UserSchema = module.exports = new Schema({
    name: String,
    password: String,
    created: { type : Date, default: Date.now() },
    lastModified: { type : Date, default: Date.now() },
    groups: { type: Schema.Types.ObjectId, ref: 'Group'}  //this should be array of ObjectId's

});

UserSchema.methods.setPassword = function(password, fn) {
    let self = this;
    
    self._hashPassword(password, function(passwordHash) {
        this.password = passwordHash;
    });
};


UserSchema.methods._hashPassword = function(password, fn) {
    bcrypt.genSalt(12, function(err, salt) {
        bcrypt.hash(password, salt, function(err, hash) {
            fn(hash);
        });
    });
};

UserSchema.methods.authenticate = function(password, fn) {
	// Load hash from your password DB.
	bcrypt.compare(password, this.password, function(err, res) {
	    if(err) {
	        throw err
	    }

	    fn(res);
	});
};