/* exported backboneSyncFactory */
function backboneSyncFactory(sync, login, originatingElement) {
	const newSync = (method, model, options = {}, attempted = false) => {
		const deferred = $.Deferred();

		Promise.resolve().then(() => {
			if (login && login.isInitialized && (_.result(model.model, 'syncRequiresLogin') || _.result(model, 'syncRequiresLogin'))) {
				return login.requireLogin({
					originatingElement: originatingElement
				});
			}
		}).then(() => {
			if (login && login.isInitialized && (_.result(model.model, 'syncRequiresLogin') || _.result(model, 'syncRequiresLogin'))) {
				options['beforeSend'] = (jqXHR) => {
					jqXHR.setRequestHeader('Authorization', `AuthSession ${login.sid}`);
				};
			}

			options['contentType'] = options['contentType'] || 'application/json';

			sync.call(this, method, model, options).then((...args) => {
				deferred.resolve(...args);
			}, (jqXHR, textStatus, errorThrown) => {
				const errorMessageTemplate = _.template(`An error ocurred. Error code <%- status %>. <%= message %>`);
				let errorMessage;

				if (jqXHR.status >= 500 && jqXHR.status <= 599) {
					errorMessage = errorMessageTemplate({
						status: jqXHR.status,
						message: 'Server side error. Please contact your administrator.'
					});
				} else if (jqXHR.status === 400 && !jqXHR.responseJSON && jqXHR.responseText && jqXHR.responseText.indexOf('Session id') !== -1
				&& jqXHR.responseText.indexOf('is invalid') !== -1) {
					if (!attempted && login && login.isInitialized && (_.result(model.model, 'syncRequiresLogin') || _.result(model, 'syncRequiresLogin'))) {
						login.showLogin({
							onHidden: () => {
								login.checkLogin(options).then(() => {
									newSync.call(this, method, model, options, true);
								}, () => {
									if (login.sid) {
										login.logout();
									}
								});
							},
							originatingElement: originatingElement
						});
					} else {
						errorMessage = errorMessageTemplate({
							status: jqXHR.status,
							message: jqXHR.responseText
						});
					}
				} else if (jqXHR.responseJSON && jqXHR.responseJSON.error && jqXHR.responseJSON.error.message) {
					errorMessage = errorMessageTemplate({
						status: jqXHR.status,
						message: jqXHR.responseJSON.error.message
					});
				} else if (jqXHR.responseText) {
					errorMessage = errorMessageTemplate({
						status: jqXHR.status,
						message: jqXHR.responseText
					});
				} else {
					errorMessage = errorMessageTemplate({
						status: jqXHR.status,
						message: errorThrown
					});
				}

				deferred.reject(jqXHR, textStatus, errorMessage);
			});
		}, () => {
			deferred.reject(null, null, 'Login Required.');
		});

		return deferred;
	};

	return newSync;
}
