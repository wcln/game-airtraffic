/**
 * BCLearningNetwork.com
 * Air Traffic Controller
 * @author Colin Bernard
 * March 2017
 */

//////////////////// VARIABLES
var mute = false;

/**
 * Handles initialization of game components
 * Called from HTML body onload.
 */
function init() {
	stage = new createjs.Stage("gameCanvas"); // canvas id is gameCanvas
	stage.mouseEventsEnabled = true;
	stage.enableMouseOver(); // Default, checks the mouse 20 times/second for hovering cursor changes
	canvas = document.getElementById("gameCanvas");

	loadImages(); // load all sprites from sheet
	loadSounds();
	initActionListeners(); // load action listeners for sprites
	stage.update(); 

	//ticker calls update function, set the FPS
	createjs.Ticker.setFPS(30);
	createjs.Ticker.addEventListener("tick", update); // call update function
}

/*
 * Main update function
 */
function update(event) {
	stage.update(event);

}

/**
 * Loads sound files using SoundJS
 */
function loadSounds() {
	if (!createjs.Sound.initializeDefaultPlugins()) { return; }

	var audioPath = "sounds/";
	// var sounds = [
	// 	{id:"hit", src:"hit.mp3"},
	// 	{id:"miss", src:"miss.mp3"},
	// 	{id:"win", src:"win.wav"},
	// 	{id:"lose", src:"lose.wav"},
	// 	{id:"click", src:"click.wav"}
	// ];

	// createjs.Sound.alternateExtensions = ["mp3"];
	// createjs.Sound.registerSounds(sounds, audioPath);
}

/*
 * Load and set initial position of all images.
 */
function loadImages() {

}

/*
 * Initialize sprite action listeners.
 */
function loadActionListeners() {

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