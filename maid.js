var env = process.env.NODE_ENV || 'development';

console.log("Starting Maid IRC.\nEnvironment: " + env);

// Check to see if it is a supported environment variable

if (["production, development", "debug"].indexOf(env.toLowerCase()) < 0) {
	console.warn('Sorry! NODE_ENV: "' + env + '" is not recognized. Try "development" or "production".');
}

var http = require("http"),
	express = require("express"),
	fs = require("fs"),
	// Middleware
	favicon = require("serve-favicon"),
	bodyParser = require("body-parser"),
	methodOverride = require('method-override'),
	lessMiddleware = require('less-middleware'),
	// Maid IRC libs
	maidStatic = require("./lib/maidStatic"),
	maidIrc = require("./lib/maidIrc");


// Define express for the next part
var app = express();

// Do things depending on which environment were in
switch (env) {
	case "development":
		var morgan = require("morgan");
		app.use(morgan("dev"));
		break;
	case "production":
		var minify = require("express-minify");
		app.use(minify());
		break;
	case "debug":
		// For socket.io debug
		break;
}

// Get config
var config = require("./config.js");

// Set up express
app.set("views", __dirname + "/views");
app.set("view engine", "jade");

// Middleware
app.use(require("errorhandler")());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(methodOverride());

// Set up less.css middleware
var forceCompile = false;

if (env !== "production") {
	forceCompile = true;
}
app.use(lessMiddleware(__dirname + "/public", {
	compress: true,
	optimization: 2,
	cacheFile: __dirname + "/cache",
	force: forceCompile
}));

app.use(express.static(__dirname + "/public"));
app.use(favicon(__dirname + "/public/img/icons/favicon.ico"));

// Define server
var server = http.createServer(app).listen(config.http_port, config.http_host),
	// Set up socket.io
	io = require("socket.io").listen(server);

// Now that thats done with lets pass it of to maidStatic.js
maidStatic(app);
maidIrc(io);