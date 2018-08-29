/* global cot_app cot_login CotSession */

class ExtendedCotSession extends CotSession {

	// METHOD DEFINITION

	isLoggedIn(serverCheckCallback) {
		if (typeof serverCheckCallback !== 'function') {
			return super.isLoggedIn();
		}

		const sid = this.sid || this._cookie('sid');
		if (!sid) {
			serverCheckCallback(CotSession.LOGIN_CHECK_RESULT_FALSE);
			return;
		}

		let url = `${this.options['ccApiOrigin']}${this.options['ccApiPath']}${this.options['ccApiEndpoint']}`;
		if (url.indexOf('/c3api_auth/v2/AuthService.svc/AuthSet') !== -1) {
			url = `${url}('${sid}')`;
		} else {
			url = `${url}/${sid}`;
		}

		$.get(url).done((data) => {
			const app = data['app'] || '';
			const rsid = data['sid'] || '';
			const error = data['error'] || '';

			if (app === this.options['appName'] && rsid === sid) {
				this._storeLogin(data);
				serverCheckCallback(CotSession.LOGIN_CHECK_RESULT_TRUE);
			} else if (error === 'no_such_session') {
				this.logout();
				serverCheckCallback(CotSession.LOGIN_CHECK_RESULT_FALSE);
			} else {
				serverCheckCallback(CotSession.LOGIN_CHECK_RESULT_INDETERMINATE);
			}
		}).fail(() => {
			serverCheckCallback(CotSession.LOGIN_CHECK_RESULT_INDETERMINATE);
		});
	}

	login(options) {
		options = $.extend({
			'username': '',
			'password': '',
			'success': (() => { }),
			'error': (() => { }),
			'always': (() => { })
		}, options);

		const payload = {
			'app': this.options['appName'],
			'user': options['username'],
			'pwd': options['password']
		};

		const ajaxSettings = {
			'method': 'POST',
			'url': `${this.options['ccApiOrigin']}${this.options['ccApiPath']}${this.options['ccApiEndpoint']}`
		};

		if (ajaxSettings['url'].indexOf('/c3api_auth/v2/AuthService.svc/AuthSet') !== -1) {
			ajaxSettings['contentType'] = 'application/json';
			ajaxSettings['data'] = JSON.stringify(payload);
		} else {
			ajaxSettings['data'] = payload;
		}

		$.ajax(ajaxSettings).done((data) => {
			if (data['error']) {
				options['error'](null, data.error === 'invalid_user_or_pwd' ? 'Invalid username or password' : 'Login failed', data.error);
			} else if (data['passwordIsExpired']) {
				options['error'](null, 'Expired password', 'passwordIsExpired');
			} else {
				this._storeLogin(data);
				options['success']();
			}
		}).fail((jqXHR, textStatus, error) => {
			options['error'](jqXHR, textStatus, error);
		}).always(() => {
			options['always']();
		});
	}
}

class PrototypeCopyCotLogin { }
PrototypeCopyCotLogin.prototype = cot_login.prototype;

/* exported ExtendedCotLogin */
class ExtendedCotLogin extends PrototypeCopyCotLogin {

	// CONSTRUCTOR DEFINITION

	constructor(options = {}) {
		super();

		this.options = $.extend({
			appName: '',
			ccRoot: '',
			ccPath: '',
			ccEndpoint: '',
			welcomeSelector: '',
			loginMessage: '',
			onLogin: (() => { })
		}, options);

		if (!this.options['appName']) {
			throw new Error('Error: the appName option is required');
		}

		this.session = new ExtendedCotSession({
			appName: this.options['appName'],
			ccApiOrigin: this.options['ccRoot'] || undefined,
			ccApiPath: this.options['ccPath'] || undefined,
			ccApiEndpoint: this.options['ccEndpoint'] || undefined
		});

		this._setUserName();
	}

	// METHOD DEFINITION

	checkLogin(options = {}) {
		if (!options['serverSide']) {
			if (this.isLoggedIn()) {
				return Promise.resolve();
			} else {
				return Promise.reject();
			}
		}

		return new Promise((resolve, reject) => {
			this.isLoggedIn((result) => {
				if (result === CotSession.LOGIN_CHECK_RESULT_TRUE) {
					resolve();
				} else {
					reject();
				}
			});
		});
	}

	isLoggedIn(serverCheckCallback) {
		return this.session.isLoggedIn(serverCheckCallback);
	}

	requireLogin(options) {
		return Promise.resolve().then(() => {
			return this.checkLogin(options);
		}).catch(() => {
			return new Promise((resolve, reject) => {
				this.showLogin($.extend({
					onHidden: () => {
						this.checkLogin(options).then(() => {
							resolve();
						}, () => {
							reject();
						});
					}
				}, options));
			});
		}).catch(() => {
			this.logout();
			return Promise.reject();
		});
	}

	showLogin(options) {
		this.modal = cot_app.showModal($.extend({
			'body': `{{> extended_cotlogin.body.template.html }}`,

			'className': 'cot-login-modal',

			'footerButtonsHtml': `{{> extended_cotlogin.footerbuttons.template.html }}`,

			'onShown': () => {
				this.modal.find('.btn-cot-login').click(() => {
					this._login();
				});

				this.modal.find('.modal-body input').keydown((event) => {
					if ((event.charCode || event.keyCode || 0) === 13) {
						this._login();
					}
				});
			},

			'originatingElement': $(this.options['welcomeSelector']).find('a.login'),

			'title': 'User Login',
		}, options));
	}
}
