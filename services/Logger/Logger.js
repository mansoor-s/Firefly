var path = require( 'path' );
var fs = require( 'fs' );
var util = require( 'util' );

var Logger = module.exports = function( firefly, config ) {
    this._firefly = firefly;
    this._config = config; 
};


Logger.prototype.log = function( errorObject ) {
    var self = this;
    var time = new Date();
    var yearPath = this._config.LOG_DIR + time.getFullYear() + '/';
    var monthPath = yearPath + (time.getMonth() + 1) + '/';
    var dayPath = monthPath + time.getDate();
    path.exists( yearPath, function ( yearExists ) {
        if ( yearExists ) {
            path.exists( monthPath, function ( monthExists ) { 
                if ( monthExists ) {
                    self._writeLog( dayPath, errorObject);
                } else {
                    fs.mkdir( monthPath, 0777, function( err ) {
                        self._writeLog( dayPath, errorObject);
                    } );
                }
            } );
        } else {
            fs.mkdir( yearPath, 0777, function( err ) {
                fs.mkdir( monthPath, 0777, function( err ) {
                    self._writeLog( dayPath, errorObject);
                });
            });
        }
    });
};

Logger.prototype._writeLog = function( dayPath, errorObject ) {
    //console.log(errorObject.stack);
    //util.inspect(errorObject, false, false);
    fs.open(dayPath, 'a', 666, function( e, id ) {
        fs.write( id, 'string to append to file', 0777, 'utf8', function(){
            fs.close(id, function(){
                //console.log('file closed');
            } );
        } );
    } );
};