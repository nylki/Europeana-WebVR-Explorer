'use strict'

var app, scene, layout, voiceRec, welcomeDialog, cam
var waitingImages = []
var imagePlanes = []
var imagesAdded = 0
var radius = 4
var activeElement
var imageEuropeana = new Europeana()
var soundEuropeana = new Europeana()
var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition
var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList
var SpeechRecognitionEvent = SpeechRecognitionEvent || webkitSpeechRecognitionEvent

// var URL = URL || webkitURL
app = document.getElementById('app')
scene = document.getElementById('scene')
layout = document.getElementById('layout')

function setActiveElement(e) {
	console.log('active element');
	activeElement = e.target.parentElement
	setTimeout(() => {
		app.emitUserNotification(activeElement.dataset.title)
	}, 500);


}

function createImagePlane(object) {

	// return imagePlane
}


function _createImagePlanes() {

	var radians = (deg) => deg * (Math.PI / 180)

	let planes = []
	for (var s = 0; s < 359; s += 110) {
	for (var t = 0; t < 359; t += 110) {
		let s_rad = radians(s)
		let t_rad = radians(t)
		// yields 50 a-images, steps are 72 degrees spherical distance
		let imagePlane = document.createElement('a-image')
		imagePlane.setAttribute('visible', 'false')

		let x = radius * Math.cos(s_rad) * Math.sin(t_rad)
		let y = radius * Math.sin(s_rad) * Math.sin(t_rad)
		let z = radius * Math.cos(t_rad)
		let x_close = x / 3
		let y_close = y / 3
		let z_close = z / 3

		imagePlane.setAttribute('look-at', '#camera')
		imagePlane.setAttribute('side', 'front')
		imagePlane.setAttribute('opacity', '0.0')
		imagePlane.setAttribute('position', `${x} ${y} ${z}`)

		let mouseleaveevent = document.createElement('a-animation')
		let mouseenterevent = document.createElement('a-animation')
		let loaded = document.createElement('a-animation')

		loaded.setAttribute('attribute', 'opacity')
		loaded.setAttribute('to', '1.0')
		loaded.setAttribute('dur', '3000')
		loaded.setAttribute('begin', 'material-texture-loaded')

		mouseenterevent.setAttribute('attribute', 'position')
		mouseenterevent.setAttribute('from', `${x} ${y} ${z}`)
		mouseenterevent.setAttribute('to', `${x_close} ${y_close} ${z_close}`)
		mouseenterevent.setAttribute('dur', '1000')
		mouseenterevent.setAttribute('begin', 'click')
		mouseleaveevent.setAttribute('fill', 'forward')
		mouseenterevent.addEventListener('animationend', setActiveElement)

		mouseleaveevent.setAttribute('attribute', 'position')
		mouseleaveevent.setAttribute('to', `${x} ${y} ${z}`)
		mouseleaveevent.setAttribute('dur', '500')
		mouseleaveevent.setAttribute('fill', 'forwards')
		mouseleaveevent.setAttribute('begin', 'mouseleave')

		// mouseenterevent.setAttribute('attribute', 'scale')
		// mouseenterevent.setAttribute('from', '1 1 1')
		// mouseenterevent.setAttribute('to', '4.5 4.5 4.5')
		// mouseenterevent.setAttribute('dur', '1000')
		// mouseenterevent.setAttribute('begin', 'click')
		// mouseleaveevent.setAttribute('fill', 'forward')
		// mouseenterevent.addEventListener('animationend', setActiveElement)
		//
		// mouseleaveevent.setAttribute('attribute', 'scale')
		// mouseleaveevent.setAttribute('to', '1 1 1')
		// mouseleaveevent.setAttribute('dur', '500')
		// mouseleaveevent.setAttribute('fill', 'forwards')
		// mouseleaveevent.setAttribute('begin', 'mouseleave')


		imagePlane.appendChild(mouseenterevent)
		imagePlane.appendChild(mouseleaveevent)
		imagePlane.appendChild(loaded)

		planes.push(imagePlane)
		scene.appendChild(imagePlane)

		imagePlane.addEventListener('material-texture-loaded', function (e) {
			console.log('IMAGES LOADED!!!!!!!!!!!!!!');
		});

		imagePlane.addEventListener('click', function (e) {


		});

	}
	}

	return planes
}

function init() {

	welcomeDialog = document.getElementById('welcome')
	app.voiceRecognitionEnabled = true
	app.soundEnabled = true

	// HACK: once injected elements can have a look-at again, remove this
	// imagePlanes = _createImagePlanes()

	welcomeDialog.addEventListener('iron-overlay-closed', function (e) {
		console.log('dialog closed')
		console.log('app.voiceRecognitionEnabled', app.voiceRecognitionEnabled)
		console.log('app.soundEnabled', app.soundEnabled)

		if(app.soundEnabled) {
			console.log(app.$.voicePlayer)
			app.$.voicePlayer.addEventListener('start', function() {
				app.$.voiceRecognizer.abort()
				console.log('stopped voice recognizer')
			})

			app.$.voicePlayer.addEventListener('end', function() {
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
		welcomeDialog.open()
	})
}


function update() {
	if(imageEuropeana.canGetObjects() === false) return

	imageEuropeana.getObject().then((object) => {
		console.log(object)
		// console.log(imagesAdded);
		// console.log(object.src);
		// console.log(imagePlanes[imagesAdded])
		// imagePlanes[imagesAdded].setAttribute('visible', true)
		// imagePlanes[imagesAdded].setAttribute('material', 'src:url(' + object.src + ')')
		// imagePlanes[imagesAdded].dataset.title = object.details.title[0]
		// console.log(imagePlanes[imagesAdded].dataset.details)

		let imagePlane = document.createElement('a-image')

		let x = Math.random() * 10
		let y = Math.random() * 10
		let z = Math.random() * 10

		imagePlane.setAttribute('look-at', '#camera')
		// imagePlane.setAttribute('side', 'front')
		// imagePlane.setAttribute('opacity', '0.2')
		imagePlane.setAttribute('position', `${x} ${y} ${z}`)

		imagePlane.setAttribute('material', 'src:url(' + object.src + ')')
		imagePlane.dataset.title = object.details.title[0]

		let loaded = document.createElement('a-animation')
		loaded.setAttribute('attribute', 'opacity')
		loaded.setAttribute('to', '1.0')
		loaded.setAttribute('dur', '3000')
		loaded.setAttribute('begin', 'material-texture-loaded')

		imagePlane.appendChild(loaded)
		scene.appendChild(imagePlane)

		imagePlanes.push(imagePlane)
		// scene.appendChild(plane)
		imagesAdded = (imagesAdded + 1) % 50
	})
}

function clickedCanvas() {
	// console.log(app.$.voiceRecognizer);
	// console.log('bla');
	// app.emitUserNotification('i am listening.')
	// app.$.voiceRecognizer.start()
}

app.searchKeyUp = function (e) {
	if(e.keyIdentifier === 'Enter') {
		app.search()
	}
}

app.voiceRecognized = function (e) {
	app.query = e.detail.result
	app.search()
	return e.detail.result
}

app.search = function() {
	console.log('search', app.query)

	// clear previous images
	imagesAdded = 0
	for (let img of imagePlanes) {
		img.setAttribute('visible', 'false')
		img.removeAttribute('material')
	}

	return imageEuropeana.search({queryString: app.query, mediaType: 'image', limit:1})
	.then((response) => {
		console.log(response)

		if(imageEuropeana.canGetObjects() === false) {

			app.emitUserNotification('Sorry, couldn\'t find enough images for' + app.query + '. Try something else!')

		} else {
			app.$.voiceRecognizer.abort()
			app.emitUserNotification('Getting images for ' + app.query)

			// search for sound
			soundEuropeana.search({queryString: app.query, mediaType: 'sound', limit:1})
			.then(() => {
				app.loadNewSound()
				app.$.soundPlayer.addEventListener('ended', (e) => {
					console.log('sound player has ended')
					app.loadNewSound()
				})
			})

			// now do the limitless full search
			return imageEuropeana.search({queryString: app.query, mediaType: 'image'})
		}
	}).then(app.resetQuery)

}

app.loadNewSound = function () {
	if(soundEuropeana.canGetObjects() === false)
		return
	return soundEuropeana.getObject().then(soundObject => {
		app.$.soundPlayer.src = soundObject.src
		app.$.soundPlayer.play()
	})
}

app.resetQuery = function () {
	console.log('resetting')
	app.query = ''
	app.$.voiceRecognizer.text = ''
	app.$.soundPlayer.pause()
	// if(app.voiceRecognitionEnabled) app.$.voiceRecognizer.start()
	console.log(app.query + ' ----- ' + app.$.voiceRecognizer.text)
}

app.emitUserNotification = function (msg) {
	if(app.soundEnabled) {
		// app.$.voicePlayer.cancel()
		app.$.voicePlayer.text = msg
		app.$.voicePlayer.speak()
	}
	// TODO: show msg
}

app.addEventListener('dom-change', init)

scene.addEventListener('loaded', function (e) {
	cam = document.getElementById('camera')
	// for (var i = 0; i < 25; i++) {
	// 	addTestElement()
	// }
});
