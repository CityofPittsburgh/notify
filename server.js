var restify = require('restify'),
	request = require('request'),
	twilioUrl = "https://api.twilio.com/2010-04-01/",
	twilioAccount = process.env.TWILIO_ACCOUNT,
	twilioNumber = process.env.TWILIO_NUMBER,
	twilioToken = process.env.TWILIO_TOKEN,
	notifyToken = process.env.NOTIFY_TOKEN,
	notifications = {
		"snow": "Calling all Snow Angels! Can you shovel today?"
	};

// Handle notification requests.
function notify(req, res, next) {

	var notification = notifications[req.params.notification]

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
		for(var property in req.body) {

			// Standardize recipient number.  (Remove non-numbers.)  (Remove initial '1' if present.)
			var recipient = req.body[property].replace(/[^0-9]/g, "").replace(/^1(.*)/g, "$1");
			console.log("Queueing message to " + recipient);

			// Queue message.
			request.post(
				{
					auth: {
						"user": twilioAccount,
						"pass": twilioToken
					},
					url: twilioUrl + 'Accounts/' + twilioAccount + '/Messages.json',
					form: {
						"To": "+1" + recipient,
						"From": twilioNumber,
						"Body": notification
					}
				},
				function(error, httpResponse, body) {
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
			"numbers": req.body
		});
		next();
	}
}

// Configure server.
var server = restify.createServer();
server.use(restify.bodyParser({ mapParams: false }));
server.use(restify.queryParser({ mapParams: false }));

// Set routes.
server.post('/notifications/:notification', notify);

// Start server.
server.listen(process.env.NOTIFY_PORT, function() {
	console.log('%s listening at %s', server.name, server.url);
});
