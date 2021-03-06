module.exports = function(app, config, sendEmail, User) {

    app.post("/stripe-test-webhooks", function(req, res) {
		var event = req.body;

		switch(event.type) {
			case "invoice.payment_succeeded":
                if (event && event.data && event.data.object && event.data.object.customer) {
					var chargeObject = event.data.object;
					var amountCharged = "$" + chargeObject.total.toFixed(2) / 100;
					var orderNumber = chargeObject.charge;
                    var periodEnd = chargeObject.period_end;
                    var query = {
                        "stripeCustomerId": chargeObject.customer
                    };

                    User.findOne(query).exec(function(error, user) {
                        var title = "Your subscription has renewed";

                        if (user && user.local.email) {
                            if (typeof user.lastStripePaymentId === undefined) {
                                title = "Welcome to Apollo!";
                            }
                            user.lastStripePaymentId = orderNumber;
                            user.subscriptionExpirationDate = periodEnd;
                            user.save(function (err) {
                                if (err) {
                                    res.send(err);
                                } else {

                                }
                            });

                            var emailBodyContent = "\
                              <div style=\"font-size: 20px; font-family:'Courier New', Courier, 'Lucida Sans Typewriter', 'Lucida Typewriter', monospace; text-align: left; padding-bottom: 30px;\">" + title + "</div>\
                              <table align=\"left\" style=\"font-size: 14px; padding-bottom: 50px; text-align: left; width: 100%;\">\
                                <tr>\
                                  <td>\<span style=\"font-weight: bold;\">Price: </span></td>\
                                  <td>" + amountCharged + " /month</td>\
                                </tr>\
                                <tr>\
                                  <td><span style=\"font-weight: bold;\">Order #: </span></td>\
                                  <td>" + orderNumber + "</td>\
                                </tr>\
                              </table>\
                              <div style=\"text-align: left;\"><a style=\"color: white;\" href=\"https://apolloqa.com/profile\">Manage your subscription</a><div>\
                            ";
                            sendEmail(user.local.email, config.emailDefaultFromAddress, "Payment Confirmation", "Thank you.", emailBodyContent);
                            res.send(200);
                        } else {
                            res.send(500);
                        }
                    });
        		}
				break;
				default:
					res.send(500);
					break;
		}
    });

    app.post("/stripe-webhooks", function(req, res) {
        res.send(500);
    });
}
