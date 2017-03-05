/**
 * BCLearningNetwork.com
 * Air Traffic
 * @author Colin Bernard
 * March 2017
 */

//////////////////// VARIABLES

// settings (may be changed)
var PLANE_MIN_SPEED = 1;
var PLANE_MAX_SPEED = 2.2;
var PLANE_FLY_AWAY_SPEED = 15;
var FPS = 40;


var mute = false;
var manifest;
var preload;
var progressText;
var startText;
var scoreText;
var planeImages = [];

var userInput; // user input text box

var gameStarted = false;

var currentAnswer = 8;


var score = 0;

// constants (set in init function)
var STAGE_WIDTH;
var STAGE_HEIGHT;


// plane object
var planeObject = new Object();



/**
 * Handles initialization of game components
 * Called from HTML body onload.
 */
function init() {
	// set constants
	STAGE_WIDTH = document.getElementById("gameCanvas").getAttribute("width");
	STAGE_HEIGHT = document.getElementById("gameCanvas").getAttribute("height");

	// init state object
	stage = new createjs.Stage("gameCanvas"); // canvas id is gameCanvas
	stage.mouseEventsEnabled = true;
	stage.enableMouseOver(); // Default, checks the mouse 20 times/second for hovering cursor changes

	userInput = document.getElementById("overlayed").firstElementChild; // userInput.value gets value of input textbox
	document.getElementById("enter").onclick = enterPressed;

	// add loading progress text (used by preload)
	progressText = new createjs.Text("", "20px Arial", "#000000");
	progressText.x = 300 - progressText.getMeasuredWidth() / 2;
	progressText.y = 20;
	stage.addChild(progressText);
	stage.update();

	setupManifest(); // preloadJS
	startPreload();
	stage.update(); 
}

/*
 * Main update function
 */
function tick(event) {
	if (gameStarted) {

		planeObject.bitmap.x += planeObject.speed; // move the plane to the right
		planeObject.label.x = planeObject.bitmap.x + planeObject.width/2 - planeObject.label.getMeasuredWidth()/2; // center label over plane


		if (planeObject.bitmap.x > STAGE_WIDTH) {


			if (!planeObject.solved) { // if the plane left the screen without the question being solved
				updateScore(-100);
			}

			planeObject.bitmap.x = -planeObject.width;
			setupPlanes();

		}







	
	}
	stage.update(event);
}

//////////////////////////////////////////////////////////////////////////// PRELOADJS FUNCTIONS

function setupManifest() {
	manifest= [{
		src: "images/plane.png",
		id: "plane"
	}];
}

function startPreload() {
	preload = new createjs.LoadQueue(true);
    preload.installPlugin(createjs.Sound);          
    preload.on("fileload", handleFileLoad);
    preload.on("progress", handleFileProgress);
    preload.on("complete", loadComplete);
    preload.on("error", loadError);
    preload.loadManifest(manifest);
}

function handleFileLoad(event) {
    console.log("A file has loaded of type: " + event.item.type);
    // create bitmaps of images
   	if (event.item.id == "plane") {
   		planeImages[0] = new createjs.Bitmap(event.result);
   	}
}

function loadError(evt) {
    console.log("Error!",evt.text);
}

function handleFileProgress(event) {
    progressText.text = (preload.progress*100|0) + " % Loaded";
    stage.update();
}

function loadComplete(event) {
    console.log("Finished Loading Assets");

    // display start screen
    startText = new createjs.Text("Click To Start", "50px Arial");
    startText.x = STAGE_WIDTH/2 - startText.getMeasuredWidth()/2;
    startText.y = STAGE_HEIGHT/2 - startText.getMeasuredHeight()/2;
    stage.addChild(startText);
    stage.update();
    stage.on("stagemousedown", startGame, null, false);
}

//////////////////////////////////////////////////////////////////////////////// END PRELOADJS FUNCTIONS

function startGame(event) {
	event.remove();
	//ticker calls update function, set the FPS
	createjs.Ticker.setFPS(FPS);
	createjs.Ticker.addEventListener("tick", tick); // call tick function
	createjs.Tween.get(startText)
		.to({x:-500},500) // remove start text from visible canvas
		.call(initGraphics);
	stage.removeChild(progressText);
}

/*
 * Adds images to stage and sets initial position.
 */
function initGraphics() {
	setupPlanes();

	// score text
	scoreText = new createjs.Text("Score: " + score, "20px Arial", "#000000");
	scoreText.x = STAGE_WIDTH - scoreText.getMeasuredWidth() - 10;
	scoreText.y = 10;
	stage.addChild(scoreText);


	// once everything added...
	gameStarted = true;
}

function setupPlanes() {
	planeObject.bitmap = planeImages[0];
	planeObject.width = planeImages[0].getBounds().width;
	planeObject.height = planeImages[0].getBounds().height;
	planeObject.bitmap.x = 0;
	planeObject.bitmap.y = Math.floor(Math.random() * 300) + 50; // between 50 and 300
	planeObject.question = "\u221A64";
	planeObject.solved = false; // has the question been solved yet?
	planeObject.speed = Math.floor(Math.random() * PLANE_MAX_SPEED) + PLANE_MIN_SPEED;
	planeObject.label = new createjs.Text(planeObject.question, "20px Arial", "#000000");
	planeObject.label.y = planeObject.bitmap.y - planeObject.label.getMeasuredHeight();
	stage.addChild(planeObject.label);
	stage.addChild(planeObject.bitmap);
}

/*
 * Enter button is pressed
 */
function enterPressed() {
	if (parseInt(userInput.value) == currentAnswer) {
		var currentX = planeObject.bitmap.x;
		console.log(currentX);
		updateScore(100);
		stage.removeChild(planeObject.label);
		planeObject.speed = PLANE_FLY_AWAY_SPEED;
	} else {
		updateScore(-50);

	}
}

/*
 * Updates game score (including displayed text)
 */
function updateScore(amount) {
	score += amount;
	scoreText.text = "Score: " + score;
	scoreText.x = STAGE_WIDTH - scoreText.getMeasuredWidth() - 10;
}


/*
 * Toggles mute variable. Called from HTML button.
 */
function toggleMute() {
	mute = !mute;

	if (mute) {
		document.getElementById("mute").firstElementChild.setAttribute("src", "images/mute.png");
	} else {
		document.getElementById("mute").firstElementChild.setAttribute("src", "images/unmute.png");
	}
}