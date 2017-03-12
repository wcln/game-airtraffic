/**
 * BCLearningNetwork.com
 * Air Traffic
 * @author Colin Bernard
 * March 2017
 */

//////////////////// VARIABLES

// unicode characters
var EXPONENT_2 = "\u00B2";
var SQUARE_ROOT = "\u221A";

// settings (may be changed)
var questions =  [SQUARE_ROOT+"64", SQUARE_ROOT+"81", SQUARE_ROOT+"25", "9"+EXPONENT_2];
var answers = [8, 9, 5, 81];
var PLANE_MIN_SPEED = 1;
var PLANE_MAX_SPEED = 2.2;
var PLANE_FLY_AWAY_SPEED = 15;
var MAX_TIME_BETWEEN_LANDING_PLANE_SPAWN = 6000; // 6 seconds
var MIN_TIME_BETWEEN_LANDING_PLANE_SPAWN = 1000; // 1 second
var FPS = 40;

// unicode characters
var EXPONENT_2 = "\u00B2";
var SQUARE_ROOT = "\u221A";


var lastPlaneSpawnedTime;

var mute = false;
var manifest;
var preload;
var progressText;
var startText;
var scoreText;
var planeImages = []; // array of all the possible plane images
var questionCounter;

var userInput; // user input text box
var questionElement; // selected question

var gameStarted = false;


var score = 0;

// constants (set in init function)
var STAGE_WIDTH;
var STAGE_HEIGHT;

var landingPlanes = []; // array of all the plane objects which spawn in the sky and want to land
var takeoffPlanes = []; // array of all the plane objects which spawn on the ship and want to take off
var selectedPlane;

// plane object
var planeObject = new Object();

var graphics = new createjs.Graphics(); // init graphics object used for drawing selected rectangles
graphics.setStrokeStyle(1);
var box;


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

	questionCounter = 0;

	userInput = document.getElementById("user-input"); // userInput.value gets value of input textbox
	questionElement = document.getElementById("question"); // the question <p> element
	userInput.onclick = clearTextbox; // clears the contents of the textbox if user clicks on it
	userInput.onkeydown = function(e) { // check if enter key is pressed on textbox
		if (e.keyCode == 13) {
			enterPressed();
		}
	};
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

		if (box != null) {
			box.x -= landingPlanes[questionCounter].speed;
		}

		landingPlanes[questionCounter].bitmap.x -= landingPlanes[questionCounter].speed; // move the plane to the left
		landingPlanes[questionCounter].label.x = landingPlanes[questionCounter].bitmap.x + landingPlanes[questionCounter].width/2 - landingPlanes[questionCounter].label.getMeasuredWidth()/2; // center label over plane


		
		
		if (landingPlanes[questionCounter].bitmap.x + landingPlanes[questionCounter].width < 0) {

			if (!landingPlanes[questionCounter].solved) { // if the plane left the screen without the question being solved
				updateScore(-100);
				stage.removeChild(landingPlanes[questionCounter].label);
				resetSelectedPlane();

			}

			if (questionCounter < questions.length - 1) {
				questionCounter++;
				//planeObject.bitmap.x = STAGE_WIDTH;
				//setupPlanes();

			} else { // no more questions... game is over

				//endGame();

			}
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
	lastPlaneSpawnedTime = MAX_TIME_BETWEEN_LANDING_PLANE_SPAWN; // spawn a plane immediately
}

function endGame() {
	gameStarted = false;
	alert("Game Complete! Score: " + score);
	init();
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

/*
 * Initialize array of planes with plane objects.
 */
function setupPlanes() {


	for (var i = 0; i < questions.length; i++) {
		landingPlanes.push({
			bitmap: Object.create(planeImages[0]), // create a new instance of the plane image
			width: planeImages[0].getBounds().width,
			height: planeImages[0].getBounds().height,
			question: questions[i],
			answer: answers[i],
			solved: false,
			speed: Math.floor(Math.random() * PLANE_MAX_SPEED) + PLANE_MIN_SPEED,
			label: new createjs.Text(questions[i], "20px Arial", "#000000")
		});

		landingPlanes[i].bitmap.name = i; // store the id in the bitmap name so that listener can identity this object

		landingPlanes[i].bitmap.x = STAGE_WIDTH;
		landingPlanes[i].bitmap.y = Math.floor(Math.random() * 300) + 50; // between 50 and 300
		landingPlanes[i].label.x = STAGE_WIDTH;
		landingPlanes[i].label.y = landingPlanes[i].bitmap.y - landingPlanes[i].label.getMeasuredHeight(); // this will not be updated later


		landingPlanes[i].bitmap.on("click", function Timmy(event) {
			if (box != null) {
				stage.removeChild(box); // remove box if there is previously one
			}

			var id = event.target.name;

			// add selection box around the plane
			box = new createjs.Shape();
			box.graphics.setStrokeDash([2,2]);
			box.graphics.beginStroke("red").drawRect(landingPlanes[id].bitmap.x - 10, landingPlanes[id].bitmap.y - 10, landingPlanes[id].width + 20, landingPlanes[id].height + 20);
			stage.addChild(box);

			selectedPlane = landingPlanes[id]; // set this planeObject as the selected plane

			// update HTML question <p>
			document.getElementById("question").innerHTML = landingPlanes[id].question + " = ";
		});
		landingPlanes[i].mouseEnabled = true;

		// add to stage
		stage.addChild(landingPlanes[i].bitmap);
		stage.addChild(landingPlanes[i].label);
	}
}


/*
 * Enter button is pressed
 */
function enterPressed() {

	if (selectedPlane == null) { // no plane is selected
		alert("Please select (click) on a plane!");
	} else {
		if (parseInt(userInput.value) == selectedPlane.answer) { // correct answer

		updateScore(100);
		stage.removeChild(landingPlanes[questionCounter].label);
		stage.removeChild(box);
		//planeObject.speed = PLANE_FLY_AWAY_SPEED;
		landingPlanes[questionCounter].solved = true;
		land(landingPlanes[questionCounter]); // animation of the plane landing

	} else { // wrong answer
		updateScore(-50);

	}

	
	clearTextbox(); // clear the user input field
	}


}

/*
 * Animation of plane landing on the ship.
 * @param plane: the plane object
 */
function land(plane) {
	plane.speed = 0; // set plane speed to 0 since we will be suing TweenJS for this, not the tick function

	createjs.Tween.get(plane.bitmap)
		.to({x:plane.bitmap.x - 1000, y:400}, 3500) // send plane off to left of screen
		.call(function() {
			plane.bitmap.regX = plane.width/2;
			plane.bitmap.regY = plane.height/2;
			plane.bitmap.scaleX = -1; // flip plane horizontally for landing
		})
		.to({x:STAGE_WIDTH/2 - 200, y:440}, 3000) // decelerate plane for landing in increments
		.to({x:STAGE_WIDTH/2 - 100, y:450}, 1000)
		.to({x:STAGE_WIDTH/2, y: 460}, 1000)
		.to({alpha:0}, 1000) // fade plane out
		.call(function() {
			stage.removeChild(plane.bitmap); // remove plane from stage
		});
	
	resetSelectedPlane();
}

/*
 * Sets no plane selected.
 */
function resetSelectedPlane() {
	selectedPlane = null;
	questionElement.innerHTML = "";
}

/*
 * Clears contents of textbox when user clicks on it.
 */
function clearTextbox() {
	userInput.value = "";
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