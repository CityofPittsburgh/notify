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
	var participantsUrl = "http://webhost.pittsburghpa.gov:5984/snow-angels/",
		geocoderUrl = "http://gisdata.alleghenycounty.us/arcgis/rest/services/Geocoders/Composite/GeocodeServer/findAddressCandidates"+
			"?Street="+req.body.Street+
			"&City="+req.body.City+
			"&State="+req.body.State+
			"&ZIP="+req.body.Zip+
			"&maxLocations=1&outSR=4326&f=pjson";

	request.get(
		geocoderUrl,
		function(error, response, body) {
			if(error) { res.status(500).send('The county geocoder seems to have failed.'); }
			var geocoderData = JSON.parse(body);
			req.body['lat'] = geocoderData.candidates[0].location.y;
			req.body['lon'] = geocoderData.candidates[0].location.x;
			request.post(
				{ url: participantsUrl, json: req.body },
				function(error, response, body) {
					res.status(200).send(body);
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
