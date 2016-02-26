'use strict'



var Europeana = function() {

	this.URLBase = 'http://localhost:8000/api/europeana',
	this.maxPerPage = 100
	this.maxQueueSize = 2
	this.result = {}
	this.resultBuffer = []
	this.queueSize = 0
	this.searchResult = undefined

	this.search = function(searchParameters) {
		console.log(searchParameters)

		// resetting some stuff
		this.resultBuffer = []
		this.searchResult = undefined

		// remember searchParameters for future
		this.searchParameters = searchParameters
		let page = searchParameters.page || 0
		let setResult = searchParameters.setResult || true
		let limit = searchParameters.limit || this.maxPerPage
		let u = new URLSearchParams()

		if(searchParameters.mediaType === 'sound') {
			u.append('qf', 'TYPE:SOUND')
		} else if (searchParameters.mediaType === 'image') {
			u.append('qf', 'TYPE:IMAGE')
		}

		if(setResult) {
			// reset previous result
			this.resultBuffer = []
			this.searchResult = undefined
		}

		if(page) u.append('start', page * this.maxPerPage)
		if(searchParameters.queryString) u.append('query', searchParameters.queryString)
		u.append('rows', limit)

		let finalAPIString = this.URLBase + '/query?' + u

		return fetch(finalAPIString)
		.then(rawResponse => rawResponse.json())
		.then(response => {
			if(setResult) this.searchResult = response
			return response
		})
	}

	this.canGetObjects = () => (this.queueSize <= this.maxQueueSize) && this.searchResult !== undefined && this.searchResult.success && this.searchResult.items !== undefined && this.searchResult.totalResults > 0



	// must return a Promise!
	this.getObject = function() {
		if(this.canGetObjects() === false) throw new Error('cannot get media objects')

		this.queueSize++
		// console.log(this.searchResult)
		let totalResults = Math.min(this.searchResult.totalResults, 999)

		// pick a random pageNumber between 0 and max_entries/45
		// eg.  1000 items: 1000 / 45 = 22 pages
		let randomItemNumber = THREE.Math.randInt(0, totalResults)
		let pageNumber = Math.floor(randomItemNumber / this.maxPerPage)
		let indexAtPage = randomItemNumber % this.maxPerPage
		let bufferPromise

		/// search in buffer for results
		/// otherwise create new buffer entry
		if (this.resultBuffer[pageNumber] !== undefined) {
			// console.log('\n item in bufferfound! use it.\n')

			if (this.resultBuffer[pageNumber].length < 1) {
				bufferPromise = Promise.reject('couldnt download image. page is completely empty.')
			} else {
				bufferPromise = Promise.resolve(this.resultBuffer[pageNumber][indexAtPage])
			}


		} else {
			// nothing in buffer found, get results and create new page in buffer
			let searchParameters = Object.assign({}, this.searchParameters)
			searchParameters.page = pageNumber
			searchParameters.limit = this.maxPerPage
			searchParameters.setResult = false

			bufferPromise = this.search(searchParameters)
			.then(searchResult => {
				this.resultBuffer[pageNumber] = searchResult.items

				if (this.resultBuffer[pageNumber].length < 1) {
					throw new Error('page is completely empty')
				}

				let bufferEntry = this.resultBuffer[pageNumber][indexAtPage]
				// console.log(this.resultBuffer)
				// console.log(pageNumber, indexAtPage)
				return bufferEntry
			})
		}

		// once we have the meta object from buffer or by finding and adding to buffer
		// get more details and download image into it

		let choosenObject = {}

		return bufferPromise.then(bufferEntry =>{
			choosenObject = bufferEntry
			return this.getDetails(choosenObject)
		})
		.then(details => {
			choosenObject.details = details
			let imageURL = choosenObject.details.aggregations[0].edmIsShownBy
			// construct image src from proxy url + original image url
			choosenObject.src = (this.URLBase + '/images?') + imageURL
			this.queueSize--
			return choosenObject
		})
		.catch(err => {
			console.log('error when downloading image.');
			this.queueSize--
			throw err
		})
	}


	this.getDetails = function(object) {
		return fetch(this.URLBase + '/record?' + object['id'])
			.then(rawResponse => rawResponse.json())
			.then(record => record.object)
	}

	this.loadImage = function (url) {
		// console.log('loading image')
		let test = document.createElement('a-image')
		test.setAttribute('src', this.URLBase + '/images?' + url)
		test.setAttribute('scale', '2, 2, 2')
		return test
		}

}
