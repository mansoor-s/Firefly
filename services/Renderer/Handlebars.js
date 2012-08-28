'use strict';

let fs = require('fs');
let Handlebars = require('handlebars');

/*
    Wrapper for Handlebars

*/
let Renderer = module.exports = function(app) {
   
    this._views = undefined;
    
     /* cache structure:
       
        cache: {
            path: content
        }
    */
    this.cache = {};
    
    app.addInitDependency(this._onInit());
};


/*
    Function: _onInit

        Private function called on application initialization
*/
Renderer.prototype._onInit = function() {
    let self = this;
    return function(fn) {
        fn();
    };
};

/*
    Function: setViews

        Set an internal map of view names and file paths. This function will call buildCache
    
    parameters: 

        views - {Object} object containing map of view names and file paths
        fn -  {Function} callback
*/
Renderer.prototype.setViews = function(views, fn) {
    this._views = views;
    this.buildCache(fn);
};


/*
    Function buildCache

        Build a cache of filepaths and its contents in memory. So not to hit the disk for every request.

    Parameters: 

        fn - {Function} callback

*/
Renderer.prototype.buildCache = function(fn) {
    for (let i = 0, len = this._views.length; i < len; ++i) {
        let viewPath = this._views[i];
        let data = fs.readFileSync(viewPath, 'utf8');
        let template = Handlebars.compile(data);
        
        this.cache[viewPath] = template;
    }

    fn();
};



/*
    Function rebuildCache

        Rebuild cache. Clears the file contents cach and calls buildCache

    Parameters: 

        fn - {Function} callback

*/
Renderer.prototype.rebuildCache = function(fn) {
    this.cache = {};
    this.buildCache(fn);
};



/*
    Function render

        Render a view

    Parameters: 

        path -{String} view file path 
        fn - {Function} callback

*/
Renderer.prototype.render = function(path, opts) {
    let template = this.cache[path];
    if (!template) {
        throw new Error('View `' + path + '` not found');
    }
    
    return template(opts);
};