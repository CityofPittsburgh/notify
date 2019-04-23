var express = require('express'),
	request = require('request'), 
	bodyParser = require('body-parser'),
	couchUrl = process.env.COUCH_URL;

// Configure client server.
var app = express();
app.use(express.static('assets'));
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.get('/', function(req, res){
	res.status(404);
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

	request.get(
		geocoderUrl,
		function(error, response, body) {
			if(error) { res.status(500).send('The data center geocoder seems to have failed.'); }
			var geocoderData = JSON.parse(body);
			req.body['lat'] = geocoderData.data.geom.coordinates[1];
			req.body['lon'] = geocoderData.data.geom.coordinates[0];
			req.body['contractor'] = "none";

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

// Start client server.
app.listen(process.env.SNOWTIFY_PORT, function() {
	console.log('Snowtify listening at %s.', process.env.SNOWTIFY_PORT);
});
