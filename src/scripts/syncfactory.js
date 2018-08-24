/* exported syncFactory */
function syncFactory(sync, cotLogin) {
	const newSync = (method, model, options = {}, attempt = 1) => {
		const deferred = $.Deferred();

		Promise.resolve().then(() => {
			if (_.result(model, 'syncNeedsLogin')) {
				if (cotLogin) {
					return cotLogin.requireLogin({
						originatingElement: options.$originatingElement
					});
				} else {
					return Promise.reject();
				}
			}
		}).then(() => {
			if (_.result(model, 'syncNeedsLogin')) {
				options['beforeSend'] = (jqXHR) => {
					jqXHR.setRequestHeader('Authorization', `AuthSession ${cotLogin.sid}`);
				};
			}

			options['contentType'] = options['contentType'] || 'application/json';

			sync.call(this, method, model, options).then(deferred.resolve, (jqXHR, textStatus, errorThrown) => {
				if (jqXHR.status >= 500 && jqXHR.status <= 599) {
					errorThrown = 'Server side error. Please contact your administrator.';
				} else if (jqXHR.status === 400 && !jqXHR.responseJSON && jqXHR.responseText && jqXHR.responseText.indexOf('Session id') !== -1
					&& jqXHR.responseText.indexOf('is invalid') !== -1) {

					if (attempt === 1) {
						cotLogin.showLogin({
							onHidden: () => {
								cotLogin.checkLogin(options).then(() => {
									newSync.call(this, method, model, options, attempt + 1);
								}, () => {
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
					errorThrown = jqXHR.responseJSON.error.message
				} else if (jqXHR.responseText) {
					errorThrown = jqXHR.responseText
				}

				deferred.reject(jqXHR, textStatus, errorThrown);
			});
		}, () => {
			deferred.reject(null, null, 'Login Required');
		});

		return deferred;
	};

	return newSync;
}
