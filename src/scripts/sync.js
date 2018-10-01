Backbone.sync = ((sync) => {
	let syncCounter = 0;

	return function(method, model, options = {}) {
		const deferred = $.Deferred();

		Promise.resolve().then(() => {
			if (model.syncNeedsLogin === true) {
				if (Backbone.sync.cotLogin != null) {
					return Backbone.sync.cotLogin.requireLogin({
						originatingElement: options['$originatingElement']
					});
				} else {
					return Promise.reject();
				}
			}
		}).then(() => {
			if (model.syncNeedsLogin === true) {
				options['beforeSend'] = (jqXHR) => {
					jqXHR.setRequestHeader('Authorization', `AuthSession ${Backbone.sync.cotLogin.sid}`);
				};
			}

			options['contentType'] = options['contentType'] || 'application/json';

			syncCounter = syncCounter + 1;
			Backbone.trigger('sync', 'on', syncCounter);
			Backbone.trigger('sync:on', syncCounter);

			sync.call(this, method, model, options).then((data, textStatus, jqXHR) => {
				deferred.resolve(data, textStatus, jqXHR);
			}, (jqXHR, textStatus, errorThrown) => {
				if (jqXHR.status >= 500 && jqXHR.status <= 599) {
					deferred.reject(jqXHR, textStatus, 'Server side error. Please contact your administrator.');
				} else if (jqXHR.status === 400 && !jqXHR.responseJSON && jqXHR.responseText && jqXHR.responseText.indexOf('Session id') !== -1
					&& jqXHR.responseText.indexOf('is invalid') !== -1) {

					if (model.syncNeedsLogin === true && Backbone.sync.cotLogin != null && options['secondAttempt'] !== true) {
						Backbone.sync.cotLogin.showLogin({
							onHidden: () => {
								Backbone.sync.cotLogin.checkLogin(options).then(() => {
									options['secondAttempt'] = true;
									Backbone.sync(method, model, options).then((data, textStatus, jqXHR) => {
										deferred.resolve(data, textStatus, jqXHR);
									}, (jqXHR, textStatus, errorThrown) => {
										deferred.reject(jqXHR, textStatus, errorThrown);
									});
								}, () => {
									if (Backbone.sync.cotLogin.sid != null) {
										Backbone.sync.cotLogin.logout();
									}
								});
							},
							originatingElement: options['$originatingElement']
						});
					} else {
						deferred.reject(jqXHR, textStatus, 'Login Required.');
					}
				} else if (jqXHR.responseJSON && jqXHR.responseJSON.error && jqXHR.responseJSON.error.message) {
					deferred.reject(jqXHR, textStatus, jqXHR.responseJSON.error.message);
				} else if (jqXHR.responseText) {
					deferred.reject(jqXHR, textStatus, jqXHR.responseText);
				} else {
					deferred.reject(jqXHR, textStatus, errorThrown);
				}
			}).always(() => {
				syncCounter = (syncCounter > 0) ? syncCounter - 1 : 0;
				Backbone.trigger('sync', 'off', syncCounter);
				Backbone.trigger('sync:off', syncCounter);
			});
		}, () => {
			deferred.reject(null, null, 'Login Required');
		});

		return deferred;
	};
})(Backbone.sync);

Backbone.sync.cotLogin = null;
