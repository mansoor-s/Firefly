YUI.add("yuidoc-meta", function(Y) {
   Y.YUIDoc = { meta: {
    "classes": [
        "Cookie",
        "Firefly",
        "Handlebars",
        "Mailer",
        "Mongoose",
        "Permission",
        "RenderManager",
        "Request",
        "Response",
        "Router",
        "Server",
        "SessionManager",
        "WSServer"
    ],
    "modules": [
        "Core",
        "Services"
    ],
    "allModules": [
        {
            "displayName": "Core",
            "name": "Core",
            "description": "Firefly object constructor"
        },
        {
            "displayName": "Services",
            "name": "Services",
            "description": "Initialize Mongoose and set it as a service named 'Mongoose' with Firefly"
        }
    ]
} };
});