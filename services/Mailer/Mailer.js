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

var async = require('async');
var nodemailer = require('nodemailer');



/*
    Mailer

        Handles mailing for Firefly

    Parameters:

        firefly - reference to the application Firefly object
        defaults - {Object} Default configurations for Mailer. Containing properties: from, to, subject, html, attachements
*/
var Mailer = module.exports = function(firefly, defaults) {
    this._firefly = firefly;
    this._defaults = defaults;

    this._nodeMailerTransport = nodemailer.createTransport('Sendmail', '/usr/sbin/sendmail');
};



/*
    Function: send

        Send a single email

    Parameters:

        addr - Email address of the recipient
        subject - Email subject
        body - Body of the email
        fn - Funciton to call when email has been sent
*/
Mailer.prototype.send = function(addr, subject, body, fn) {
    var config = Object.create(self._defaults);
    config.to = addr;
    config.subject = subject;
    config.html = body;

    this._nodeMailerTransport.sendMail(config, function(err) {
        if(err) {
            //do logging here
        }

        fn();
    });
    
};



/*
    Function: batchSend

        Send an email to multiple recipients

    Parameters:

        addr - Array containing email addresses of the recipients
        subject - Email subject
        body - Body of the email
        fn - Funciton to call when email has been sent
*/
Mailer.prototype.batchSend = function(addrs, subject, body, fn) {
    var self = this;
    var curr = 0;
    var len = addrs.length;

    var mailFns = [];

    for (var i = 0; i < len; ++i) {
        var addr = addrs[i];

        mailFns.push(function(cb) {
            var addr = addrs[curr];
            var config = Object.create(self._defaults);
            config.to = addr;
            config.subject = subject;
            config.html = body;

            this._nodeMailerTransport.sendMail(config, function(err) {
                if(err) {
                    //do logging here
                }

                cb();
            });
        });
    }

    async.parallel(mailFns, function() {
        fn();
    });
};