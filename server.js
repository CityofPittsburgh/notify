var restify = require('restify'),
	request = require('request'),
	notifyToken = process.env.NOTIFY_TOKEN,
	twilioAccount = process.env.TWILIO_ACCOUNT,
	twilioNumber = process.env.TWILIO_NUMBER,
	twilioToken = process.env.TWILIO_TOKEN,
	twilioUrl = "https://api.twilio.com/2010-04-01/Accounts/" + twilioAccount,
	date = new Date(),
	messages = {
		"snow": "Hi Snow Angels! This is an automated reminder that snow may need shoveled today. Questions? Email SnowAngels@pittsburghpa.gov. Thanks!"
	};

function setReply(req, res, next) {
	if(req.body.Body = "Y") {
		
	}
	res.send(200, req.body.Body);
	next();
}

function getMessages(req, res, next) {
	if(req.params.message == undefined) {
		res.send(200, messages);
	} else {
		res.send(200, messages[req.params.message]);
	}
	next();
}

function getNotifications(req, res, next) {
	request.get(
		{
			auth: {
				"user": twilioAccount,
				"pass": twilioToken
			},
			url: twilioUrl + '/Messages.json',
		},
		function(error, response, body) {
			var notifications = JSON.parse(body).messages.map(function(notification){
				var notificationDate = notification.body.match(/[0-9]{1,2}-[0-9]{1,2}-[0-9]{4}/i);
				if(notificationDate != null){
					notification["id"] = notificationDate[0];
					return notification;
				}
			}).reduce(function(accumulated, current){
				if(current != undefined) {
					if(accumulated[current.id]) {
						accumulated[current.id].push(current);
					} else {
						accumulated[current.id] = [current];
					}
				}
				return accumulated;
			}, {});

			res.send(200, notifications);
		}
	);
	next();
}

// Handle notification requests.
function notify(req, res, next) {

	var notification = messages[req.params.notification],
		numbers = req.body.numbers;

	// Check input.
	if(!req.body) {
		res.send(400, { "message": "Request body is empty." });
		next();
	} else 

	// Check auth.
	if(req.query["token"] == undefined || req.query["token"] != notifyToken) {
		res.send(403, { "message": "Notification requires authentication." });
		next();
	} else {

		// For each number.
		for(var i=0; i < numbers.length; i++) {

			// Standardize recipient number.     (Remove non-numbers.)  (Remove any initial '1'.)
			var recipient = numbers[i].toString().replace(/[^0-9]/g, "").replace(/^1(.*)/g, "$1");
			console.log("Queueing message to " + recipient);

			// Queue message.
			request.post(
				{
					auth: {
						"user": twilioAccount,
						"pass": twilioToken
					}, 
					url: twilioUrl + '/Messages.json',
					form: {
						"To": "+1" + recipient,
						"From": twilioNumber,
						"Body": notification
					}
				},
				function(error, response, body) {
					if(error) { 
						console.log(error);
					} else if(body) { 
						console.log(body);
					}
				}
			);
		}
		res.send(201, { 
			"notification": notification,
			"numbers": numbers
		});
		next();
	}
}

// Configure server.
var server = restify.createServer();
server.use(restify.bodyParser({ mapParams: false }));
server.use(restify.queryParser({ mapParams: false }));

// Set routes.
server.get('/messages', getMessages);
server.get('/messages/:message', getMessages);
server.get('/notifications', getNotifications);
// server.get('/notifications/:notification', getNotification);

// Save notifications to db, modeling local state for replies, caching against API rate limiting and obviating need for date id.
server.post('/notifications/:notification', notify); // Create new notification in Couch, return id and notify.
server.post('/replies/:reply', reply); // Create new reply in notification, return id and reply.

// Start server.
server.listen(process.env.NOTIFY_PORT, function() {
	console.log('Notify listening at %s.', process.env.NOTIFY_PORT);
});
