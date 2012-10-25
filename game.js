// database is simulated with setTimeouts

var _activeGames = [];

function emptyBoard() {
	return [["empty", "empty", "empty"],["empty", "empty", "empty"],["empty", "empty", "empty"]];
}

function isWin(a, b, c) {
	return (a !== "empty") && (a === b) && (a === c);
}

function checkWin(gameboard) {
	var winner = null;
	for(var i=0; winner === null && i<3; i++) {
		if(isWin(gameboard[i][0], gameboard[i][1], gameboard[i][2])) {
			winner = gameboard[i][0];
		} else if(isWin(gameboard[0][i], gameboard[1][i], gameboard[2][i])) {
			winner = gameboard[0][i];
		}
	}
	if(winner === null 
		&& (isWin(gameboard[0][0], gameboard[1][1], gameboard[2][2]) 
		|| isWin(gameboard[0][2], gameboard[1][1], gameboard[2][0]))) {
		winner = gameboard[1][1];
	}
	return winner;
};

function Game(difficulty, gameboard) {
	this.active = true;
	this.difficulty = difficulty;
	this.gameboard = gameboard || emptyBoard();
	this.winner = "undecided";
	var winner = checkWin(this.gameboard);
	if(winner !== null) {
		this.active = false;
		this.winner = winner;
	}
	this.checkTie();
};

Game.prototype.checkTie = function() {
	if(this.active && this.availablePositions().length === 0) {
		this.winner = "tie";
		this.active = false;
	}
}

Game.prototype.validMove = function validateMove(x, y) {
	return this.active && (this.gameboard[x][y] === "empty");
};

Game.prototype.randomMove = function(spots, callback) {
	callback(null, Math.floor(Math.random() * spots.length));
};

Game.prototype.cleverMove = function(spots, callback) {
	// it would make sense to just cache the decision tree in a db
	// but since we want to play with recursion and async we're going to do this instead
	var workQueue = [];
	var solvedQueue = [];
	spots.forEach(function(spot) {
		// dupe the board
		var gameboard = emptyBoard();
		for(var x=0; x<3; x++)
			for(var y=0; y<3; y++)
				gameboard[x][y] = this[x][y];
		workQueue.push([spot, gameboard, 0]);
	}, this.gameboard);

	var winnerFound = false;
	(function nextWork() {
		// at this point we should also check winnerFound 
		// but I want to slow it all down
		if(workQueue.length === 0) {
			solvedQueue.sort(function(a, b) { return b[2] - a[2]; });
			callback(null, solvedQueue[0][0]);
			return;
		}
		var workItem = workQueue.shift();
		var pos = workItem[0];
		var gameboard = workItem[1];
		// will we win at this spot?
		gameboard[pos.x][pos.y] = "computer";
		if(checkWin(gameboard) === "computer") {
			winnerFound = true;
			workItem[2] = 2;
			solvedQueue.push(workItem);
			return setTimeout(nextWork, 2);
		}
		// will the user win at that spot?
		gameboard[pos.x][pos.y] = "user";
		if(checkWin(gameboard) === "user") {
			workItem[2] = 1;
			solvedQueue.push(workItem);
			return setTimeout(nextWork, 2);
		}
		// if we get here then it's dud for this round.
		// not going to make it go and check future events just yet
		solvedQueue.push(workItem);
		// also
		// let's not block other http threads while we work on this one
		setTimeout(nextWork, 2);
	})();
};

Game.prototype.move = function makeMove(x, y, callback) {
	this.gameboard[x][y] = "user";
	var winner = checkWin(this.gameboard);
	if(winner !== null) {
		this.active = false;
		this.winner = winner;
	}
	if(this.active) {
		var spots = this.availablePositions();

		if(spots.length > 0) {
			var self = this;
			function onMoveFound(err, pos) {
				self.gameboard[pos.x][pos.y] = "computer";
				winner = checkWin(self.gameboard);
				if(winner !== null) {
					self.active = false;
					self.winner = winner;
				}
				self.checkTie();
				callback(null, self.gameState());
			}
			var indx = this.difficulty === "random" ? this.randomMove(spots, onMoveFound) : this.cleverMove(spots, onMoveFound);
			var pos = spots[indx];
			return;
		} else {
			this.checkTie();
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