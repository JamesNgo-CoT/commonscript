'use strict';

/* exported syncFactory */
function syncFactory(sync, cotLogin) {
	var _this = this;

	var newSync = function newSync(method, model) {
		var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
		var attempt = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1;

		var deferred = $.Deferred();

		Promise.resolve().then(function () {
			if (_.result(model, 'syncNeedsLogin')) {
				if (cotLogin) {
					return cotLogin.requireLogin({
						originatingElement: options.$originatingElement
					});
				} else {
					return Promise.reject();
				}
			}
		}).then(function () {
			if (_.result(model, 'syncNeedsLogin')) {
				options['beforeSend'] = function (jqXHR) {
					jqXHR.setRequestHeader('Authorization', 'AuthSession ' + cotLogin.sid);
				};
			}

			options['contentType'] = options['contentType'] || 'application/json';

			sync.call(_this, method, model, options).then(deferred.resolve, function (jqXHR, textStatus, errorThrown) {
				if (jqXHR.status >= 500 && jqXHR.status <= 599) {
					errorThrown = 'Server side error. Please contact your administrator.';
				} else if (jqXHR.status === 400 && !jqXHR.responseJSON && jqXHR.responseText && jqXHR.responseText.indexOf('Session id') !== -1 && jqXHR.responseText.indexOf('is invalid') !== -1) {

					if (attempt === 1) {
						cotLogin.showLogin({
							onHidden: function onHidden() {
								cotLogin.checkLogin(options).then(function () {
									newSync.call(_this, method, model, options, attempt + 1);
								}, function () {
									if (cotLogin.sid) {
										cotLogin.logout();
									}
								});
							},
							originatingElement: options.$originatingElement
						});
					} else {
						errorThrown = 'Login Required';
					}
				} else if (jqXHR.responseJSON && jqXHR.responseJSON.error && jqXHR.responseJSON.error.message) {
					errorThrown = jqXHR.responseJSON.error.message;
				} else if (jqXHR.responseText) {
					errorThrown = jqXHR.responseText;
				}

				deferred.reject(jqXHR, textStatus, errorThrown);
			});
		}, function () {
			deferred.reject(null, null, 'Login Required');
		});

		return deferred;
	};

	return newSync;
}