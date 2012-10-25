require('graphdat');

var express = require("express");
var engine = require("./game");
var conf = {
	port: 8000
}


// create and configure express
var app = express();
app.set("views", __dirname + "/views");
app.set("view engine", "jade");
app.use(express.logger());
app.use(express.compress());
app.use(express["static"](__dirname + '/public'));
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.cookieSession({
	key: "x.o", 
	secret:"purplemonkeydishwasherbattery"
}));


app.get("/activeGames", function(req, res, next) {
	res.send(engine.activeGames());
});

app.get("/changeDifficulty", function(req, res, next) {
	req.session = null;
	res.redirect("/");
});

app.get("/newGame", function(req, res, next) {
	var difficulty = req.session.gameState.difficulty;
	engine.createGame(difficulty, function(err, game) {
		var gameState = game.gameState();
		req.session.gameState = gameState;
		res.redirect("/");
	});
});

app.post("/startGame", function(req, res, next) {
	var difficulty = req.body.difficulty;

	// validate inputs here
	engine.createGame(difficulty, function(err, game) {
		var gameState = game.gameState();
		req.session.gameState = gameState;
		res.redirect("/");
	});
});

app.get("/move/:x/:y", function(req, res, next) {
	var x = parseInt(req.params.x, 10);
	var y = parseInt(req.params.y, 10);
	if(x < 0 || x > 2 || y < 0 || y > 2) {
		return res.next(new Error("Invalid Co-ordinates!"));
	}
	req.graphdat.begin("loadGame");
	engine.loadGame(req.session.gameState, function(err, game) {
		req.graphdat.end("loadGame");
		req.graphdat.begin("validateMove");
		if(!game.validMove(x, y)) {
			return next(new Error("You just made an invalid move!"));
		}
		req.graphdat.end("validateMove");
		req.graphdat.begin("makeMove");
		game.move(x, y, function(err, gameState) {
			req.graphdat.end("makeMove");
			req.session.gameState = gameState;
			res.redirect("/");
		});
	});
});

app.get("/", function(req, res, next) {
	if(req.session.gameState) {
		req.graphdat.begin("loadGame");
		engine.loadGame(req.session.gameState, function(err, game) {
			req.graphdat.end("loadGame");
			req.graphdat.begin("render");
			res.render("index", game.gameState());
		});
	} else {
		req.graphdat.begin("render");
		res.render("index");
	}
});

// error handler
app.use(function(err, req, res, next) {
	var bag = {};
	var gameState = req.session.gameState || {};
	for(var key in gameState)
		bag[key] = gameState[key];
	bag.error = err;
	res.render("index", bag);
});

app.listen(conf.port);
console.log("listening on port " + conf.port);