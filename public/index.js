'use strict'

var app, scene, voiceRec, welcomeDialog, cam
var waitingImages = []
var imagePlanes
var imagesAdded = 0
var radius = 10
var activeElement
var imageEuropeana = new Europeana()
var soundEuropeana = new Europeana()
// var URL = URL || webkitURL
app = document.getElementById('app')
scene = document.getElementById('scene')

function setActiveElement(e) {
	console.log('active element');
	activeElement = e.target.parentElement
	setTimeout(() => {
		app.emitUserNotification(activeElement.dataset.title)
	}, 500);


}

function _createImagePlanes() {
	let planes = []
	for (var i = 0; i < 51; i++) {
		let imagePlane = document.createElement('a-image')
		imagePlane.setAttribute('visible', 'false')
		let x = (Math.random() * radius) - (radius/2)
		let y = (Math.random() * (radius/2)) - (radius/4)
		let z = (Math.random() * radius) - (radius/2)
		imagePlane.setAttribute('look-at', '#camera')
		imagePlane.setAttribute('side', 'front')
		imagePlane.setAttribute('position', `${x} ${y} ${z}`)

		let mouseleaveevent = document.createElement('a-animation')
		let mouseenterevent = document.createElement('a-animation')

		mouseenterevent.setAttribute('attribute', 'scale')
		mouseenterevent.setAttribute('from', '1 1 1')
		mouseenterevent.setAttribute('to', '3 3 3')
		mouseenterevent.setAttribute('dur', '3000')
		mouseenterevent.setAttribute('fill', 'forwards')
		mouseenterevent.setAttribute('begin', 'mouseenter')
		mouseenterevent.addEventListener('animationend', setActiveElement)

		mouseleaveevent.setAttribute('attribute', 'scale')
		mouseleaveevent.setAttribute('to', '1 1 1')
		mouseleaveevent.setAttribute('dur', '500')
		mouseleaveevent.setAttribute('begin', 'mouseleave')


		imagePlane.appendChild(mouseenterevent)
		imagePlane.appendChild(mouseleaveevent)

		planes.push(imagePlane)
		scene.appendChild(imagePlane)

	}

	return planes
}

function init() {

	welcomeDialog = document.getElementById('welcome')
	app.voiceRecognitionEnabled = true
	app.soundEnabled = true

	// HACK: once injected elements can have a look-at again, remove this
	imagePlanes = _createImagePlanes()

	welcomeDialog.addEventListener('iron-overlay-closed', function (e) {
		console.log('dialog closed')
		console.log('app.voiceRecognitionEnabled', app.voiceRecognitionEnabled)
		console.log('app.soundEnabled', app.soundEnabled)

		if(app.soundEnabled) {
			console.log(app.$.voicePlayer)
			app.$.voicePlayer.addEventListener('start', function() {
				app.$.voiceRecognizer.stop()
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
		// console.log(imagesAdded);
		// console.log(object.src);
		// console.log(imagePlanes[imagesAdded])
		imagePlanes[imagesAdded].setAttribute('visible', true)
		imagePlanes[imagesAdded].setAttribute('material', 'src:url(' + object.src + ')')
		imagePlanes[imagesAdded].dataset.title = object.details.title[0]
		// console.log(imagePlanes[imagesAdded].dataset.details)
		// imagePlanes[imagesAdded].emit('fade')
		// imagePlanes[imagesAdded].setAttribute('src', 'test.jpg')
		imagesAdded = (imagesAdded + 1) % 50
	})
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
