'use strict'

var request = require('request');
var express = require('express');
var app = express();
app.listen(process.env.PORT || 5000);
app.use(express.static('public'));
app.use(express.static('node_modules'));

var fetch = require('node-fetch');
var  apikey = '8dEyJAhFi'


// on /parse/<query>
// eg. query="green landscape paintings"
// should yield something like:
// q=landscape&qf=what:painting&colourpalette
var handleQueryParsing = function (req, res, next) {
	console.log(req._parsedUrl.query)

}

var handleEuropeanaQuery = function(req, res, next) {
	let url = 'http://www.europeana.eu/api/v2/search.json?wskey='+ apikey + '&reusability=open&media=true&profile=minimal&' + req._parsedUrl.query
	// console.log(url)
	// request(url).pipe(res)
	console.log(url)
	fetch(url)
		.then(res => res.json())
		.then(json => {
			res.setHeader('Content-Type', 'application/json');
			json.apikey = 'xxxxx' // x-out the api key when responding to client
			res.send(json)
			next()
		})
}

var handleEuropeanaRecord = function (req, res, next) {
	// console.log(req.query)
	let url = 'http://www.europeana.eu/api/v2/record' + req._parsedUrl.query	 + '.json?wskey='+ apikey + ''
	console.log(url)
		// request(url).pipe(res)
	//
	fetch(url)
		.then(res => res.json())
		.then(json => {
			// console.log('got record');
			res.setHeader('Content-Type', 'application/json');
			res.send(json)
			next()
		})
}

var handleEuropeanaImage = function (req, res, next) {
	// gotta love "request", great one-line proxy :)
	request(req._parsedUrl.query).pipe(res)
}

  app.get('/api/europeana/query*', handleEuropeanaQuery)
	app.get('/api/europeana/record*', handleEuropeanaRecord)
	app.get('/api/europeana/images*', handleEuropeanaImage)
