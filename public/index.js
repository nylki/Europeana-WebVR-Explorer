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
	for (var i = 0; i < 51; i++) {
		let imagePlane = document.createElement('a-image')
		imagePlane.setAttribute('visible', 'false')
		let x = (Math.random() * radius) - (radius/2)
		let y = (Math.random() * (radius/2)) - (radius/4)
		let z = (Math.random() * radius) - (radius/2)
		imagePlane.setAttribute('look-at', '#camera')
		imagePlane.setAttribute('side', 'front')
		imagePlane.setAttribute('position', `${x} ${y} ${z}`)

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

		setInterval(update, 3000)



	})

	scene.addEventListener('loaded', function (e) {
		console.log('loaded');
		welcomeDialog.open()
	})
}

function update() {
	if(europeana.canGetObjects() === false) return

		europeana.getObject().then((object) => {
			console.log(imagesAdded);
			console.log(object.imageSrc);
			console.log(imagePlanes[imagesAdded])
			imagePlanes[imagesAdded].setAttribute('visible', true)
			imagePlanes[imagesAdded].setAttribute('material', 'src:url(' + object.imageSrc + ')')
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

	return europeana.search({queryString: app.query}).then((response) => {
		console.log(response)
		if(europeana.canGetObjects() === false) {
			app.emitUserNotification('Sorry, couldn\'t find enough images for' + app.query + '. Try something else!')
		} else {
			console.log(response)
			app.emitUserNotification('Getting images for ' + app.query)
		}
		app.resetQuery()

	})
}

app.resetQuery = function () {
	console.log('resetting')
	app.query = ''
	app.$.voiceRecognizer.text = ''
	// if(app.voiceRecognitionEnabled) app.$.voiceRecognizer.start()
	console.log(app.query + ' ----- ' + app.$.voiceRecognizer.text)
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
