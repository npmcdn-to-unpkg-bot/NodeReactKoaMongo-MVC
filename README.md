# Node.js React.js Koa.js MongoDB Stack - MVC

## Setup

1. Install node and mongo
2. In directories: create 'C:/data/db'
3. Start mongo database server: In 'C:/data/' directory, give this command: `mongod --dbpath .` in the command line. Keep this terminal open.
4. Install koa in project directory: `npm install koa`. Install any other needed packages for project by using `npm install 'package-name'`.

## Database

```
$mongo
>use tripadvisor
>db.createCollection("destination")
>db.createCollection("rating")

>db.destination.insert({"destination" : "Istanbul", "country" : "Turkey"})
>db.destination.insert({"destination" : "Derinkuyu", "country" : "Turkey"})

>db.rating.insert({"destination" : "Derinkuyu", "rating" : "Underground"})
>db.rating.insert({"destination" : "Istanbul", "rating" : "Architectural"})
```

## Code

routes.js

```js
var route = require('koa-route');

var koa = require('koa');
var app = module.exports = koa();

var ratingController = require('./Controllers/RatingController.js');
app.use(route.get('/', ratingController.show));
app.use(route.get('/read/', ratingController.readAll));
app.use(route.post('/', ratingController.create));
app.use(route.put('/', ratingController.update));
app.use(route.delete('/', ratingController.delete));

app.listen(3000);
console.log('listening on port 3000');
```

Controllers/RatingController.js

```js
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
```

Views/ratings.jade

```jade
doctype html
html(lang="en")
	extends template.jade
	block title
		title Trip Advisor
		script(src='https://cdnjs.cloudflare.com/ajax/libs/react/15.3.0/react.min.js')
		script(src='https://cdnjs.cloudflare.com/ajax/libs/react/15.3.0/react-dom.min.js') 
		script(src='https://unpkg.com/babel-core@5.8.38/browser.min.js')
	block content
		#content
			script(type='text/babel').
				
				var Entries = React.createClass({

					update: function(e){
						$.ajax({
							type: 'PUT',
							url: 'http://localhost:3000/',
							dataType: 'json',
							data: {"destination":e.target.parentElement.parentElement.childNodes[0].innerText,"rating":e.target.parentElement.childNodes[0].value},
							success: function(res) {
								window.location.replace("/");
							}.bind(this),
							error: function(xhr, status, err) {
								console.dir("Update Error");
								console.dir(xhr);
								console.dir(status);
								console.dir(err);
							}.bind(this)
						});					
					},
					
					del: function(e){
						$.ajax({
							type: 'DELETE',
							url: 'http://localhost:3000/',
							dataType: 'json',
							data: {"destination":e.target.parentElement.parentElement.childNodes[0].innerText},
							success: function(res) {
								window.location.replace("/");
							}.bind(this),
							error: function(xhr, status, err) {
								console.dir("Delete Error");
								console.dir(xhr);
								console.dir(status);
								console.dir(err);
							}.bind(this)
						});					
					},
					
					render: function(){
					
						return (
							<tr>
								<td>{this.props.item.destination}</td>
								<td>{this.props.item.country}</td>
								<td>
									<input type='text' name='rating' defaultValue={this.props.item.rating} /> 
									<button type='button' onClick={this.update}>Edit</button>
									<button type='button' onClick={this.del}>Delete</button>
								</td>
							</tr>
						);
						
					}
					
				});
				
				var List = React.createClass({

					getInitialState:function(){
						return {entries: ''}
					},
				
					componentWillMount:function(){
						$.ajax({
							type: 'GET',
							url: 'http://localhost:3000/read',
							success: function(res) {
								this.setState( JSON.parse(res) );
							}.bind(this),
							error: function(xhr, status, err) {
								console.dir("Read Error");							
								console.dir(xhr);
								console.dir(status);
								console.dir(err);
							}.bind(this)
						});
					},
									
					create: function(e){
						$.ajax({
							type: 'POST',
							url: 'http://localhost:3000/',
							dataType: 'json',
							data: {"destination":e.target.parentElement.childNodes[0].value,"country":e.target.parentElement.childNodes[1].value,"rating":e.target.parentElement.childNodes[2].value},
							success: function(res) {
								window.location = "http://localhost:3000/";
							}.bind(this),
							error: function(xhr, status, err) {
								console.dir("Create Error");
								console.dir(xhr);
								console.dir(status);
								console.dir(err);
							}.bind(this)
						});					
					},
					
					render: function(){
					
						var entries;
						if(this.state.entries !== null && this.state.entries.length > 0){
							entries = this.state.entries.map(function(item){
								return <Entries item={item} />
							});
						}

						return (
							<div className='container'>
							
								<h1>Trip Advisor</h1>
								
								<div className='row'>
									<table className='table'>
										<thead>
											<tr><td>Destination</td><td>Country</td><td>Rating</td></tr>
										</thead>
										<tbody>
											{entries}
										</tbody>										
									</table>
								</div>
								
								<div className='row'>
									<input type='text' name='destination' /> 
									<input type='text' name='country' /> 
									<input type='text' name='rating' /> 
									<button type='button' onClick={this.create}>New</button>
								</div>

							</div>
						);
						
					}
					
				});
				
				ReactDOM.render(<List />, document.getElementById('content'))
```

## Results

Serve project by: `node --harmony routes.js`

![](https://raw.githubusercontent.com/atabegruslan/NodeReactKoaMongo-MVC/master/Illustrations/KoaReact01.PNG)
