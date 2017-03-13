/**
 * BCLearningNetwork.com
 * Air Traffic
 * @author Colin Bernard (colinjbernard@hotmail.com)
 * March 2017
 */



// unicode characters
var EXPONENT_2 = "\u00B2";
var SQUARE_ROOT = "\u221A";

///////////////// THESE SETTINGS MAY BE CHANGED WITHOUT TOO MUCH CONSEQUENCE ///////////////////////////////
var questions =  [SQUARE_ROOT+"64", SQUARE_ROOT+"81", SQUARE_ROOT+"25", "9"+EXPONENT_2, SQUARE_ROOT+"16", SQUARE_ROOT+"9", SQUARE_ROOT+"49", "10"+EXPONENT_2, "2"+EXPONENT_2, "6"+EXPONENT_2, "11"+EXPONENT_2, SQUARE_ROOT+"36", "5"+EXPONENT_2, SQUARE_ROOT+"4"];
var answers = [8, 9, 5, 81, 4, 3, 7, 100, 4, 36, 121, 6, 25, 2];
var PLANE_MIN_SPEED = 1;
var PLANE_MAX_SPEED = 2.2;
var PLANE_FLY_AWAY_SPEED = 15;
var MAX_TIME_BETWEEN_PLANE_SPAWN = 8000; // 8 seconds
var MIN_TIME_BETWEEN_PLANE_SPAWN = 4000; // 4 seconds
var FPS = 40;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////// VARIABLES ////////////////////////////////////

// preloadJS
var manifest;
var preload;
var progressText;
var startText;

// HTML elements
var userInput; // user input text box
var questionElement; // selected question
var overlayedDiv; // the overlayed div which contains the above elements
var mute = false;

// utility
var gameStarted = false;
var score = 0;
var scoreText;
var alertText; // alerts the player
var alertBox; // rectangle behind the alert text
var background; // the background image
var ambianceSound;

// constants (set in init function)
var STAGE_WIDTH;
var STAGE_HEIGHT;

// planes
var landingPlanes = []; // array of all the plane objects which spawn in the sky and want to land
var selectedPlane; // the plane that is currently selected by the player
var numberOfPlanesTakingOff = 0; // ensures that only one plane is taking off at a time
var planeImages = []; // array of all the possible plane images
var lastPlaneSpawnedTime; // last time that a plane was spawned
var questionCounter; // keeps track of questions which have game has gone through

// graphics object
var graphics = new createjs.Graphics(); 
graphics.setStrokeStyle(1);
var box; // used for drawing selected rectangle

  //////////////////////////////
 //			FUNCTIONS		 //
//////////////////////////////


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
	score = 0; // reset score

	overlayedDiv = document.getElementById("overlayed"); // the div which contains the overlayed elements
	overlayedDiv.style.visibility = "hidden";
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
	progressText = new createjs.Text("", "20px Lato", "black");
	progressText.x = STAGE_WIDTH/2 - progressText.getMeasuredWidth() / 2;
	progressText.y = 20;
	//stage.addChild(progressText);
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

		// spawn a new plane
		if ((new Date().getTime() - lastPlaneSpawnedTime > Math.floor(Math.random() * MAX_TIME_BETWEEN_PLANE_SPAWN) + MIN_TIME_BETWEEN_PLANE_SPAWN) && questionCounter + 1 <= questions.length) {
			
			if ((Math.floor(Math.random() * 4) + 1) == 3 && numberOfPlanesTakingOff == 0) { // 1 in 4 chance to spawn a plane on the runway
				setupTakingOffPlane(landingPlanes[questionCounter]);
			} else {
				landingPlanes[questionCounter].flying = true;
			}
			questionCounter++;
			lastPlaneSpawnedTime = new Date().getTime();
		}

		var gameover = true; // check if there are no more planes flying or taking off

		// update all the landing planes
		for (var i = 0; i < landingPlanes.length; i++) {
			if (landingPlanes[i].flying) {
				gameover = false;
				landingPlanes[i].bitmap.x -= landingPlanes[i].speed; // move the plane to the left
				landingPlanes[i].label.x = landingPlanes[i].bitmap.x + landingPlanes[i].width/2 - landingPlanes[i].label.getMeasuredWidth()/2; // center label over plane
				if (landingPlanes[i].bitmap.x + landingPlanes[i].width < 0) {
					if (!landingPlanes[i].solved) { // if the plane left the screen without the question being solved
						sendAlertMessage("Missed plane! -100pts");
						updateScore(-100);
						stage.removeChild(landingPlanes[i].label); // remove the label from the stage as well
						landingPlanes[i].flying = false; // plane is no longer flying and will no longer be updated
						stage.removeChild(landingPlanes[i].bitmap);

						if (landingPlanes[i].selected) { // if the plane that left the screen was the selected one
							resetSelectedPlane(); 
						}
					}
				}


			// update the taking off plane
			} else if (landingPlanes[i].takingOff) { 
				gameover = false;

			}
		}

		// update selected box position
		if (box != null && selectedPlane != null && selectedPlane.flying) {
			box.x -= selectedPlane.speed;
		}
	
	}


	// detects when game is over (see gameover boolean variable)
	if (gameover && questionCounter == questions.length) {
		endGame();
	}

	stage.update(event);
}

//////////////////////////////////////////////////////////////////////////// PRELOADJS FUNCTIONS

function setupManifest() {
	manifest= [{
		src: "images/787.png",
		id: "787"
	},
	{
		src: "images/background.png",
		id: "background"
	},
	{
		src: "images/cessna172.png",
		id: "c172"
	},
	{
		src: "images/cf18.png",
		id: "cf18"
	},
	{
		src: "images/caravan.png",
		id: "caravan"
	},
	{
		src: "images/pc12.png",
		id: "pc12"
	},
	{
		src: "sounds/click.mp3",
		id: "click"
	},
	{
		src: "sounds/correct.mp3",
		id: "correct"
	},
	{
		src: "sounds/flyby.mp3",
		id: "flyby"
	},
	{
		src: "sounds/ambiance.mp3",
		id: "ambiance"
	}
	];
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
   	if (event.item.id == "787") {
   		planeImages[0] = new createjs.Bitmap(event.result);
   	} else if (event.item.id == "background") {
   		background = new createjs.Bitmap(event.result);
   		stage.addChild(background);
   	} else if (event.item.id == "c172") {
   		planeImages[1] = new createjs.Bitmap(event.result);
   	} else if (event.item.id == "cf18") {
   		planeImages[2] = new createjs.Bitmap(event.result);
   	} else if (event.item.id == "caravan") {
   		planeImages[3] = new createjs.Bitmap(event.result);
   	} else if (event.item.id == "pc12") {
   		planeImages[4] = new createjs.Bitmap(event.result);
   	}
}

function loadError(evt) {
    console.log("Error!",evt.text);
}

function handleFileProgress(event) {
    progressText.text = (preload.progress*100|0) + " % Loaded";
    progressText.x = STAGE_WIDTH/2 - progressText.getMeasuredWidth() / 2;
    stage.update();
}

/*
 * Displays the start screen.
 */
function loadComplete(event) {
    console.log("Finished Loading Assets");

    // display start screen
    startText = new createjs.Text("Click To Start", "50px Lato", "black");
    startText.x = STAGE_WIDTH/2 - startText.getMeasuredWidth()/2;
    startText.y = STAGE_HEIGHT/2 - startText.getMeasuredHeight()/2;
    stage.addChild(startText);
    stage.update();
    stage.on("stagemousedown", startGame, null, false);
}

//////////////////////////////////////////////////////////////////////////////// END PRELOADJS FUNCTIONS

/*
 * Starts the game.
 */
function startGame(event) {
	playSound("click");
	ambianceSound = createjs.Sound.play("ambiance", {loop:-1});
	ambianceSound.volume = 0.8;

	event.remove();
	//ticker calls update function, set the FPS
	createjs.Ticker.setFPS(FPS);
	createjs.Ticker.addEventListener("tick", tick); // call tick function
	createjs.Tween.get(startText)
		.to({x:-500},500) // remove start text from visible canvas
		.call(initGraphics);
	stage.removeChild(progressText);
	lastPlaneSpawnedTime = MAX_TIME_BETWEEN_PLANE_SPAWN; // spawn a plane immediately

	overlayedDiv.style.visibility = "visible";
}

/*
 * Displays the end game screen.
 */
function endGame() {

	overlayedDiv.style.visibility = "hidden";

	ambianceSound.stop();
	ambianceSound = null;


	gameStarted = false;
	var gameOverText = new createjs.Text("Game Complete! Score: " + score, "50px Lato", "black");
	var playAgainText = new createjs.Text("Click to play again", "40px Lato", "black");
    gameOverText.x = STAGE_WIDTH/2 - gameOverText.getMeasuredWidth()/2;
    gameOverText.y = STAGE_HEIGHT/2 - gameOverText.getMeasuredHeight()/2;
    playAgainText.x = STAGE_WIDTH/2 - playAgainText.getMeasuredWidth()/2;
    playAgainText.y = STAGE_HEIGHT/2 - playAgainText.getMeasuredHeight()/2 + 70;
	stage.addChild(gameOverText);
	stage.addChild(playAgainText);
	stage.update();
	stage.on("stagemousedown", function() {
		playSound("click");
		location.reload(); // for now just reload the document
	});
}

/*
 * Adds images to stage and sets initial position.
 */
function initGraphics() {
	shuffle(planeImages); // shuffle the plane images
	setupPlanes();

	// score text
	scoreText = new createjs.Text("Score: " + score, "20px Lato", "#000000");
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

	var imageCounter = 0;
	for (var i = 0; i < questions.length; i++) {
		if (imageCounter == planeImages.length) {
			imageCounter = 0;
		}

		landingPlanes.push({
			bitmap: Object.create(planeImages[imageCounter]), // create a new instance of the plane image
			width: planeImages[imageCounter].getBounds().width,
			height: planeImages[imageCounter].getBounds().height,
			question: questions[i],
			answer: answers[i],
			solved: false,
			flying: false, // should the plane be updated by tick method
			takingOff: false, // is the plane taking off? (set to true if plane spawns on runway)
			speed: Math.floor(Math.random() * PLANE_MAX_SPEED) + PLANE_MIN_SPEED,
			label: new createjs.Text(questions[i], "20px Lato", "#000000")
		});

		imageCounter++; // keeps track of cycling through the plane images

		landingPlanes[i].bitmap.name = i; // store the id in the bitmap name so that listener can identity this object

		landingPlanes[i].bitmap.x = STAGE_WIDTH;
		landingPlanes[i].bitmap.y = Math.floor(Math.random() * 300) + 50; // between 50 and 300
		landingPlanes[i].label.x = STAGE_WIDTH;
		landingPlanes[i].label.y = landingPlanes[i].bitmap.y - landingPlanes[i].label.getMeasuredHeight(); // this will not be updated later (unless plane is taking off)


		// plane click action listener
		landingPlanes[i].bitmap.on("click", function Timmy(event) {

			var id = event.target.name;

			if (landingPlanes[id].flying || landingPlanes[id].takingOff) {
				playSound("click");

				if (box != null) {
					stage.removeChild(box); // remove box if there is previously one
				}

				

				// add selection box around the plane
				box = new createjs.Shape();
				box.graphics.setStrokeDash([2,2]);
				box.graphics.beginStroke("red").drawRect(landingPlanes[id].bitmap.x - 10, landingPlanes[id].bitmap.y - 10, landingPlanes[id].width + 20, landingPlanes[id].height + 20);
				stage.addChild(box);

				selectedPlane = landingPlanes[id]; // set this planeObject as the selected plane

				// update HTML question <p>
				document.getElementById("question").innerHTML = landingPlanes[id].question + " = ";
			}
			
		});
		landingPlanes[i].mouseEnabled = true;

		// add to stage
		stage.addChild(landingPlanes[i].bitmap);
		stage.addChild(landingPlanes[i].label);
	}
}

/*
 * Sets attributes of a plane object such that it is in "take off" mode
 */
function setupTakingOffPlane(plane) {
	plane.bitmap.alpha = 0; // set plane to not visible
	plane.takingOff = true;
	plane.bitmap.x = STAGE_WIDTH/2 - plane.width/2;
	plane.bitmap.y = 540 - plane.height/2;
	plane.label.x = plane.bitmap.x + plane.width/2 - plane.label.getMeasuredWidth()/2; // center label over plane
	plane.label.y = plane.bitmap.y - plane.label.getMeasuredHeight();
	plane.bitmap.regX = plane.width/2;
	plane.bitmap.scaleX = -1;
	plane.bitmap.regX = plane.width;
	numberOfPlanesTakingOff++;
	createjs.Tween.get(plane.bitmap).to({alpha:1}, 1000); // fade plane in
}


/*
 * Enter button is pressed
 */
function enterPressed() {

	if (gameStarted) {
		if (selectedPlane == null) { // no plane is selected
			
			playSound("click");
			sendAlertMessage("Please select (click) on a plane!");

		} else if (numberOfPlanesTakingOff == 0 || selectedPlane.takingOff) {
			if (parseInt(userInput.value) == selectedPlane.answer) { // correct answer

				sendAlertMessage("Correct! +100pts");
				playSound("flyby");
				playSound("correct");
				updateScore(100);
				stage.removeChild(selectedPlane.label);
				stage.removeChild(box);
				//planeObject.speed = PLANE_FLY_AWAY_SPEED;
				selectedPlane.solved = true;

				if (selectedPlane.flying) {
					land(selectedPlane); // animation of the plane landing
				} else if (selectedPlane.takingOff) {
					takeOff(selectedPlane);
				}
		
			} else { // wrong answer
				sendAlertMessage("Incorrect... -50pts");
				updateScore(-50);

			}
			clearTextbox(); // clear the user input field

		} else { // if there is a plane on the runway
			sendAlertMessage("Alert! Runway is obstructed!");
			playSound("click");
		}
	}
}

/*
 * Plays a sound if the game is not muted.
 */
function playSound(id) {
	if (!mute) {
		createjs.Sound.play(id);
	}
}

/*
 * Sends an alert to the user as a createjs text.
 */
function sendAlertMessage(message) {
	if (alertText != null) { stage.removeChild(alertText); }
	if (alertBox != null) { stage.removeChild(alertBox); }

	// the alert text
	alertText = new createjs.Text(message, "16px Lato", "red");
	alertText.x = STAGE_WIDTH/2 - alertText.getMeasuredWidth()/2;
	alertText.y = 600;

	// the background alert box so the text is easier to read
	alertBox = new createjs.Shape();
	alertBox.graphics.setStrokeStyle(2);
	alertBox.graphics.beginStroke("black").beginFill("white").drawRect(STAGE_WIDTH/2 - alertText.getMeasuredWidth()/2, 600, alertText.getMeasuredWidth(), alertText.getMeasuredHeight());

	// add the alert elements to the stage
	stage.addChild(alertBox);
	stage.addChild(alertText);

	setTimeout( function() {
		stage.removeChild(alertText);
		stage.removeChild(alertBox);
	}, 3000); // alert stays for 3 seconds
}

/*
 * Animation of plane taking off from the runway.
 */
function takeOff(plane) {
	numberOfPlanesTakingOff--;
	plane.takingOff = false;
	createjs.Tween.get(plane.bitmap)
		.to({x:plane.bitmap.x + 150, rotation: -20}, 1700) // go down runway
		.to({x:plane.bitmap.x + 1000, y:plane.bitmap.y - 500}, 6000) // lift off
		.call( function() {
			stage.removeChild(plane.bitmap);
		});

	resetSelectedPlane();
}

/*
 * Animation of plane landing on the runway.
 * @param plane: the plane object
 */
function land(plane) {
	plane.speed = 0; // set plane speed to 0 since we will be suing TweenJS for this, not the tick function
	plane.flying = false; // plane will no longer be updated

	createjs.Tween.get(plane.bitmap)
		.to({x:plane.bitmap.x - 1000, y:360, rotation: -10}, 3500) // send plane off to left of screen
		.call(function() {
			plane.bitmap.regX = plane.width/2;
			plane.bitmap.regY = plane.height/2;
			plane.bitmap.scaleX = -1; // flip plane horizontally for landing
		})
		.to({x:STAGE_WIDTH/2 - 200, y:480}, 3000) // decelerate plane for landing in increments
		.to({x:STAGE_WIDTH/2 - 100, y:500}, 1000)
		.to({x:STAGE_WIDTH/2, y: 520}, 1000)
		.to({x:STAGE_WIDTH/2 + 200, alpha:0, rotation: 0}, 3000)
		//.to({alpha:0}, 1000) // fade plane out
		.call( function() {
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
		ambianceSound.stop();
		ambianceSound = null;
	} else {
		document.getElementById("mute").firstElementChild.setAttribute("src", "images/unmute.png");
		ambianceSound = createjs.Sound.play("ambiance", {loop:-1});
		ambianceSound.volume = 0.8;
	}
}

/**
 * Shuffles array in place.
 * @param {Array} a items The array containing the items.
 */
function shuffle(a) {
    var j, x, i;
    for (i = a.length; i; i--) {
        j = Math.floor(Math.random() * i);
        x = a[i - 1];
        a[i - 1] = a[j];
        a[j] = x;
    }
}