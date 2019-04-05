var express = require('express'),
	request = require('request'), 
	bodyParser = require('body-parser'),
	notifyUrl = process.env.NOTIFY_URL,
	notifyToken = process.env.NOTIFY_TOKEN,
	couchUrl = process.env.COUCH_URL;

// Configure client server.
var app = express();
app.use(express.static('assets'));
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.get('/', function(req, res){
	var snowangelsUrl = couchUrl + "/snow-angels/_design/2018-tools/_view/volunteers";
	
	request.get(
		snowangelsUrl, 
		function(error, response, body){
			var volunteers = JSON.parse(body).rows.
								map(function(volunteer){ return volunteer.key } ).
								filter(function(volunteer){ return volunteer.matched });
			
			res.render('index', {
				volunteers: volunteers, 
				snowtifyUrl: "/snowtification",
				snowtificationsUrl: "/snowtifications",
				messagesUrl: "/messages"
			});
		}
	);
});

app.get('/participants', function(req, res){
	res.render('participants');
});

app.post('/participants', function(req, res){
	var participantsUrl = couchUrl + "/city-cuts/",
		geocoderUrl = "https://tools.wprdc.org/geo/geocode?addr="+
			req.body.Street+" "+
			req.body.City+", "+
			req.body.State+" "+
			req.body.Zip;
console.log(geocoderUrl);

	request.get(
		geocoderUrl,
		function(error, response, body) {
			if(error) { res.status(500).send('The data center geocoder seems to have failed.'); }
			var geocoderData = JSON.parse(body);
console.log(geocoderData);
			req.body['lat'] = geocoderData.data.geom.coordinates[0];
			req.body['lon'] = geocoderData.data.geom.coordinates[1];

			var lotareaUrl = "https://data.wprdc.org/api/3/action/datastore_search_sql?sql=SELECT%20%22LOTAREA%22,%20%22PARID%22%20FROM%20%22518b583f-7cc8-4f60-94d0-174cc98310dc%22%20WHERE%20%22PARID%22%20%3D%20%27"
				+geocoderData.data.parcel_id+"%27";

			request.get(
				lotareaUrl,
				function(error, response, body) {
					if(error) { res.status(500).send('There was a problem looking up the parcel.'); }
					var lotareaData = JSON.parse(body);
					req.body['area'] = lotareaData.result.records[0].LOTAREA;

					request.post(
						{ url: participantsUrl, json: req.body },
						function(error, response, body) {
							res.status(200).send(body);
						}
					);
				}
			);
		}
	);
});

app.get('/snowtifications', function(req, res){
	var notificationsUrl = notifyUrl + "/notifications";
	request.get(
		notificationsUrl,
		function(error, response, body) {
			res.status(200).send(body);
		}
	);
});

app.post('/snowtification', function(req, res){
	var notificationUrl = notifyUrl + "/notifications/snow?token=" + notifyToken;
	request.post(
		{ url: notificationUrl, json: req.body },
		function(error, response, body) {
			res.status(200).send(body);
		}
	);
});

app.get('/messages', function(req, res){
	var messagesUrl = notifyUrl + "/messages/snow";
	request.get(
		messagesUrl,
		function(error, response, body) {
			res.status(200).send(body)
		}
	);
});

// Start client server.
app.listen(process.env.SNOWTIFY_PORT, function() {
	console.log('Snowtify listening at %s.', process.env.SNOWTIFY_PORT);
});
