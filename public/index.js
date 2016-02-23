'use strict'

var app, scene, voiceRec, welcomeDialog
var waitingImages = []
var imagePlanes
var imagesAdded = 0
var radius = 10
var europeana = new Europeana()
// var URL = URL || webkitURL
app = document.getElementById('app')
scene = document.getElementById('scene')

function _createImagePlanes() {
	let planes = []
	for (var i = 0; i < 50; i++) {
		let imagePlane = document.createElement('a-image')
		let x = (Math.random() * radius) - (radius/2)
		let y = (Math.random() * (radius/2)) - (radius/4)
		let z = (Math.random() * radius) - (radius/2)
		imagePlane.setAttribute('look-at', '#camera')
		imagePlane.setAttribute('position', `${x} ${y} ${z}`)
		imagePlane.setAttribute('material', 'opacity: 0.0')

		let anim = document.createElement('a-animation')
		anim.setAttribute('attribute', 'material.opacity')
		anim.setAttribute('to', '1.0')
		anim.setAttribute('dur', '10000')
		anim.setAttribute('repeat', 'indefinite')
		anim.setAttribute('begin', 'fade')
		imagePlane.appendChild(anim)

		planes.push(imagePlane)
		scene.appendChild(imagePlane)

	}
	return planes
}

function init() {

	welcomeDialog = document.getElementById('welcome')
	app.voiceRecognitionEnabled = true
	app.soundEnabled = true
	imagePlanes = _createImagePlanes()
	console.log(imagePlanes)



	welcomeDialog.addEventListener('iron-overlay-closed', function (e) {
		console.log('dialog closed')
		console.log('app.voiceRecognitionEnabled', app.voiceRecognitionEnabled)
		console.log('app.soundEnabled', app.soundEnabled)
		if(app.soundEnabled) {

			app.$.voicePlayer.addEventListener('start', function(e) {
				app.$.voiceRecognizer.stop()
				console.log('stopped voice recognizer')
			})

			app.$.voicePlayer.addEventListener('end', function(e) {
				app.$.voiceRecognizer.start()
				console.log('started voice recognizer again')
			})

			app.$.voicePlayer.speak()
		}

		if(app.voiceRecognitionEnabled) {
			app.$.voiceRecognizer.start()
		}

		setInterval(update, 2000)



	})

	scene.addEventListener('loaded', function (e) {
		console.log('loaded');
		document.querySelector('#test').addEventListener('click', function () {
  	this.setAttribute('material', 'color', 'red');
  	console.log('I was clicked!');
		update()
	});
		welcomeDialog.open()
	})
}

function update() {
	console.log('update');
	console.log('can get ob	jects', europeana.canGetObjects())
	let cam = document.getElementById('camera')
	// let cam = document.querySelector('#camera')

	// console.log(cam)
	if(europeana.canGetObjects() === false) return

	europeana.getObject().then((object) => {
		console.log(imagesAdded);
		console.log(object.imageSrc);
		console.log(imagePlanes[imagesAdded])
		imagePlanes[imagesAdded].setAttribute('hidden', false)
		imagePlanes[imagesAdded].setAttribute('material', 'src:url(' + object.imageSrc + ') opacity:0.0')
		// imagePlanes[imagesAdded].emit('fade')
		document.querySelector('#test').setAttribute('material', 'src:url(' + object.imageSrc + ')')
		// imagePlanes[imagesAdded].setAttribute('src', 'test.jpg')
		imagesAdded = (imagesAdded + 1) % 9
		})

}

app.voiceRecognized = function (e) {
	app.query = e.detail.result
	app.search()
	return e.detail.result
}

app.search = function() {
	console.log('search', app.query)
	app.emitUserNotification('Getting images for ' + app.query)
	return europeana.search({queryString: app.query}).then((result) => {
		console.log(result)
		app.emitUserNotification('Getting images for ' + e.detail.result)
	})
}

app.emitUserNotification = function (msg) {
	if(app.soundEnabled) {
		app.$.voicePlayer.text = msg
		app.$.voicePlayer.speak()
	}
	// TODO: show msg
}

app.addEventListener('dom-change', init)

scene.addEventListener('loaded', function (e) {

	// for (var i = 0; i < 25; i++) {
	// 	addTestElement()
	// }
});
