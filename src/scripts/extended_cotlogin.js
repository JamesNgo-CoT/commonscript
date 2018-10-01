/* global cot_app cot_login CotSession */

/**
 * Extends the original CotSession class.
 */
class ExtendedCotSession extends CotSession {

	// METHOD DEFINITION

	/**
	 * Verify if the user is logged in through the Auth API or the browser cookie entry.
	 * @param {function} serverCheckCallback
	 */
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

	/**
	 * Logs in the user sending a POST HTTP request. Extended to work with the latest auth API.
	 * @param {object} options
	 */
	login(options) {
		options = $.extend({
			username: '',
			password: '',
			success: (() => {}),
			error: (() => {}),
			always: (() => {})
		}, options);

		const payload = {
			app: this.options['appName'],
			user: options['username'],
			pwd: options['password']
		};

		const ajaxSettings = {
			method: 'POST',
			url: `${this.options['ccApiOrigin']}${this.options['ccApiPath']}${this.options['ccApiEndpoint']}`
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

/**
 * Class to hold cot_login class prototype but not its constructor.
 */
function PrototypeCopyCotLogin() {}
PrototypeCopyCotLogin.prototype = cot_login.prototype;

/* exported ExtendedCotLogin */
/**
 * Extends the original cot_login, but without its constructor.
 */
class ExtendedCotLogin extends PrototypeCopyCotLogin {

	// CONSTRUCTOR DEFINITION

	/**
	 * Similar to the original cot_login constructor but using the new ExtendedCotSession.
	 * @param {object} options
	 */
	constructor(options = {}) {
		super();

		this.options = $.extend({
			appName: '',
			ccRoot: '',
			ccPath: '',
			ccEndpoint: '',
			welcomeSelector: '',
			loginMessage: '',
			onLogin: (() => {})
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

	/**
	 * New method, checks if user is logged in.
	 * @param {object}  options
	 * @param {boolean} options.serverSide
	 * @return {Promise}
	 */
	checkLogin(options = {}) {
		if (!options['serverSide']) {
			if (this.isLoggedIn()) {
				return Promise.resolve(true);
			} else {
				return Promise.resolve(false);
			}
		}

		return new Promise((resolve) => {
			this.isLoggedIn((result) => {
				if (result === CotSession.LOGIN_CHECK_RESULT_TRUE) {
					resolve(true);
				} else {
					resolve(false);
				}
			});
		});
	}

	/**
	 * A proper copy of the CotSession class' isLoggedIn method.
	 * @param {function} serverCheckCallback
	 */
	isLoggedIn(serverCheckCallback) {
		return this.session.isLoggedIn(serverCheckCallback);
	}

	/**
	 * Checks the login but allowing the user to login if not already logged in.
	 * @param {object} options
	 * @return {Promise}
	 */
	requireLogin(options) {
		return this.checkLogin(options).then((isLoggedIn) => {
			if (isLoggedIn === false) {
				return new Promise((resolve, reject) => {
					this.showLogin($.extend({
						onHidden: () => {
							this.checkLogin(options).then(() => {
								resolve();
							}, () => {
								this.logout();
								reject();
							});
						}
					}, options));
				});
			}
		});
	}

	showLogin(options) {
		this.modal = cot_app.showModal($.extend({
			body: `
				<form>
					<div class="form-group">
						<label for="cot_login_username">Username</label>:
						<input class="form-control" id="cot_login_username">
					</div>
					<div class="form-group">
						<label for="cot_login_password">Password</label>:
						<input class="form-control" type="password" id="cot_login_password">
					</div>
				</form>
			`,
			className: 'cot-login-modal',
			footerButtonsHtml: `
				<button class="btn btn-primary btn-cot-login" type="button">Login</button>
				<button class="btn btn-default" type="button" data-dismiss="modal">Cancel</button>
			`,
			originatingElement: $(this.options['welcomeSelector']).find('a.login'),
			title: 'User Login',

			onShown: () => {
				this.modal.find('.btn-cot-login').click(() => {
					this._login();
				});

				this.modal.find('.modal-body input').keydown((event) => {
					if ((event.charCode || event.keyCode || 0) === 13) {
						this._login();
					}
				});
			}
		}, options));
	}
}
