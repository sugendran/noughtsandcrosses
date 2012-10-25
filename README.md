Noughts and Crosses
===================

This Node.js application is designed to illustrate the capabilities of [Graphdat](http://www.graphdat.com) a tool that lets you monitor your Node.js application and the system it lives on.  Graphdat lets you add instrumentation to your http routes so that you can see which parts of your code are slow. This tutorial assumes that you've signed up to Graphdat and have the agent running on your server or locally on your computer.

This repository has a branch called no-instrumentation that has the code prior to instrumentation. https://github.com/sugendran/noughtsandcrosses/tree/no-instrumentation

So let's get started.

```javascript
require("graphdat");
```

You need to include the graphdat module at the top of your main file before any other requires. It will then hook in and instrument any modules that it knows about. Once you've done that the module will attempt to connect to the graphdat agent on your machine to report hit count and response time stats. Pretty cool, huh? you can see which are the popular routes and which routes are slower than others. The other advantage is that you can see the system performance along side your traffic data, which makes for a very good way to find performance issues.

![Graphdat Overview](https://raw.github.com/sugendran/noughtsandcrosses/master/README_IMAGES/graphdat-overview.png)

 The HttpRequest object in any method that handles an HttpRequest will include a `graphdat` object. This is useful because we can add additional information to what Graphdat reports. As an example, let's use the path that a player hits when they want to make a move. The path is */move/:x/:y* and has 3 steps: load the game from the session state, validate the move and then finally make that move. Now if we care about performance we want to measure each step and see if we can improve it. And overtime our graph should show this improvement.

The `graphdat` object that is added to the HttpRequest will let you begin and end a timer so that you can measure each section. The following snippet illustrates how it works

 ```javascript
app.get("/move/:x/:y", function(req, res, next) {
	var x = parseInt(req.params.x, 10);
	var y = parseInt(req.params.y, 10);
	if(x < 0 || x > 2 || y < 0 || y > 2) {
		return res.next(new Error("Invalid Co-ordinates!"));
	}
	// begin the timer for loading the game from state
	req.graphdat.begin("loadGame");
	engine.loadGame(req.session.gameState, function(err, game) {
		// end the timer for loading the game from state
		req.graphdat.end("loadGame");
		// begin timer to validate the move the player wants to make
		req.graphdat.begin("validateMove");
		if(!game.validMove(x, y)) {
			return next(new Error("You just made an invalid move!"));
		}
		// end timer to validate the move
		req.graphdat.end("validateMove");
		// begin timer for making the move
		req.graphdat.begin("makeMove");
		game.move(x, y, function(err, gameState) {
			// end timer for making the move
			req.graphdat.end("makeMove");
			req.session.gameState = gameState;
			res.redirect("/");
		});
	});
});
 ```

Now when I expand the response time graph and click on a spike I see something like this: 
![Drill into response times on Graphdat](https://raw.github.com/sugendran/noughtsandcrosses/master/README_IMAGES/graphdat-drilldown.png)

What's really cool about this is that we can now see how parts of the code function with different amounts of traffic. And we can work out which sections are slowing down or which sections could use with some improvement.