var Routes = module.exports = {
    'Site': {
        basePattern: '',
        applet: 'Site'
    },

    'Admin': {
    	basePattern: 'admin',
    	applet: 'Admin',
    	requirements: {
    		__userType: 'admin'
    	}
    }
};
