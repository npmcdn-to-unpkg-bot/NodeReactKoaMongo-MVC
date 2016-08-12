var parse = require('co-body');
var views = require('co-views');
var monk = require('monk');
var wrap = require('co-monk');
var db = monk('localhost/tripadvisor');
var destination = wrap(db.get('destination'));
var rating = wrap(db.get('rating'));

var koa = require('koa');
var app = koa();

var render = views('./Views', {default:'jade'});

module.exports.show = function * (){
	this.body = yield render('ratings');
}

module.exports.readAll = function * () {
	var destinations = yield destination.find({});

	var params = new Array();
	
	for (var key in destinations) {
		
		var ratings = yield rating.findOne({'destination': destinations[key].destination });

		params.push( { destination: destinations[key].destination , country: destinations[key].country , rating: ratings.rating} );
		
	}	
	
	this.body = JSON.stringify( {'entries' :params} );
}

module.exports.create = function * () {
	var newEntry = yield parse(this);
	
	yield destination.insert( { 'destination': newEntry.destination , 'country': newEntry.country } );
	yield rating.insert( { 'destination': newEntry.destination , 'rating': newEntry.rating } );
	
	this.body = JSON.stringify( {'result' : 'created'} );
}

module.exports.update = function * () {
	var updatedEntry = yield parse(this);
	var destination = updatedEntry.destination;	
	var newRating = updatedEntry.rating;	

	yield rating.update({'destination':destination}, {$set: {rating: newRating}});
	
	this.body = JSON.stringify( {'result' : 'updated'} );
}

module.exports.delete = function * () {
	var deleteEntry = yield parse(this);
	var deleteDestination = deleteEntry.destination;	
	
	yield destination.remove({'destination': deleteDestination});
	yield rating.remove({'destination': deleteDestination});
	
	this.body = JSON.stringify( {'result' : 'deleted'} ); 
}