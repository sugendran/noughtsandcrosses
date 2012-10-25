// database is simulated with setTimeouts

var _activeGames = [];

function Game(difficulty, gameboard) {
	this.active = true;
	this.difficulty = difficulty;
	this.gameboard = gameboard || [["empty", "empty", "empty"],["empty", "empty", "empty"],["empty", "empty", "empty"]];
	this.winner = "undecided";
	this.checkWin();
	if(this.active && this.availablePositions().length === 0) {
		this.winner = "tie";
		this.active = false;
	}
};

function isWin(a, b, c) {
	return (a !== "empty") && (a === b) && (a === c);
}

Game.prototype.checkWin = function checkWin() {
	var winnerFound = false;
	var gameboard = this.gameboard;
	for(var i=0; !winnerFound && i<3; i++) {
		if(isWin(gameboard[i][0], gameboard[i][1], gameboard[i][2])) {
			this.winner = gameboard[i][0];
			this.active = false;
			winnerFound = true;
		} else if(isWin(gameboard[0][i], gameboard[1][i], gameboard[2][i])) {
			this.winner = gameboard[0][i];
			this.active = false;
			winnerFound = true;
		}
	}
	if(!winnerFound 
		&& (isWin(gameboard[0][0], gameboard[1][1], gameboard[2][2]) 
		|| isWin(gameboard[0][2], gameboard[1][1], gameboard[2][0]))) {
		this.winner = gameboard[1][1];
		winnerFound = true;
		this.active = false;
	}
	return winnerFound;
};

Game.prototype.validMove = function validateMove(x, y) {
	return this.active && (this.gameboard[x][y] === "empty");
};

Game.prototype.move = function makeMove(x, y, callback) {
	this.gameboard[x][y] = "user";
	this.checkWin();
	if(this.active) {
		var spots = this.availablePositions();

		if(spots.length > 0) {
			// need to pick where to go
			// for now it's just random
			var indx = Math.floor(Math.random() * spots.length);
			var pos = spots[indx];
			this.gameboard[pos.x][pos.y] = "computer";
			this.checkWin();
		}

		if(this.active && this.availablePositions().length === 0) {
			this.winner = "tie";
			this.active = false;
		}
	}
	var state = this.gameState();
	setTimeout(function(){
		callback(null, state);
	}, 100);
};

Game.prototype.gameState = function getState() {
	return {
		difficulty: this.difficulty,
		gameboard: this.gameboard,
		active: this.active,
		winner: this.winner
	};
};

Game.prototype.isActive = function isActive() {
	return this.active;
};

Game.prototype.availablePositions = function getAvailPos() {
	var result = [];
	for(var x=0; x<3; x++) {
		for(var y=0; y<3; y++) {
			if(this.gameboard[x][y] === "empty") {
				result.push({ x: x, y: y });
			}
		}
	}
	return result;
}

function activeGames() {
	return _activeGames;
};

function loadGame(gameState, callback) {
	var game = new Game(gameState.difficulty, gameState.gameboard);
	setTimeout(function() {
		callback(null, game);
	}, 100);
};

function createGame(difficulty, callback) {
	var game = new Game(difficulty);
	_activeGames.push(game);
	setTimeout(function() {
		callback(null, game);
	}, 100);
};

module.exports.activeGames = activeGames;
module.exports.createGame = createGame;
module.exports.loadGame = loadGame;