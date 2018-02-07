var express = require('express'),
	csv = require("fast-csv"),
	notifyToken = process.env.NOTIFY_TOKEN,
	notifyUrl = process.env.NOTIFY_URL,
	snowtifyNumbersPath = process.env.SNOWTIFY_NUMBERS_PATH;

// Configure client server.
var app = express();
app.use(express.static('assets'));
app.set('view engine', 'ejs');
app.get('/', function(req, res){
	var numbers = [];

	csv
	.fromPath(snowtifyNumbersPath, { headers:true, ignoreEmpty: true })
	.on("data", function(data){
		if(data['Matched..Y.N.'] != '') {
			numbers.push({ 
				name: data.Firstname + " " + data.Lastname, 
				number: data.Phone_Number.replace(/[^0-9]/g, "").replace(/^1(.*)/g, "$1")
			});
		}
	}).on("end", function(){
		res.render('index', { 
			username: 'Nick', 
			numbers: numbers, 
			notifyUrl: notifyUrl + "notifications/snow?token=" + notifyToken,
			notificationsUrl: notifyUrl + "notifications?token=" + notifyToken,
			messagesUrl: notifyUrl + "messages/snow"
		});
	});
	
});

app.post('/snowtification', function(req, res){

});

// Start client server.
app.listen(process.env.SNOWTIFY_PORT, function() {
	console.log('Snowtify listening at %s.', process.env.SNOWTIFY_PORT);
});
