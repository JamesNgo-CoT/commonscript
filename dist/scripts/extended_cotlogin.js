'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/* global cot_app cot_login CotSession */

var ExtendedCotSession = function (_CotSession) {
	_inherits(ExtendedCotSession, _CotSession);

	function ExtendedCotSession() {
		_classCallCheck(this, ExtendedCotSession);

		return _possibleConstructorReturn(this, (ExtendedCotSession.__proto__ || Object.getPrototypeOf(ExtendedCotSession)).apply(this, arguments));
	}

	_createClass(ExtendedCotSession, [{
		key: 'isLoggedIn',


		// METHOD DEFINITION

		value: function isLoggedIn(serverCheckCallback) {
			var _this2 = this;

			if (typeof serverCheckCallback !== 'function') {
				return _get(ExtendedCotSession.prototype.__proto__ || Object.getPrototypeOf(ExtendedCotSession.prototype), 'isLoggedIn', this).call(this);
			}

			var sid = this.sid || this._cookie('sid');
			if (!sid) {
				serverCheckCallback(CotSession.LOGIN_CHECK_RESULT_FALSE);
				return;
			}

			var url = '' + this.options['ccApiOrigin'] + this.options['ccApiPath'] + this.options['ccApiEndpoint'];
			if (url.indexOf('/c3api_auth/v2/AuthService.svc/AuthSet') !== -1) {
				url = url + '(\'' + sid + '\')';
			} else {
				url = url + '/' + sid;
			}

			$.get(url).done(function (data) {
				var app = data['app'] || '';
				var rsid = data['sid'] || '';
				var error = data['error'] || '';

				if (app === _this2.options['appName'] && rsid === sid) {
					_this2._storeLogin(data);
					serverCheckCallback(CotSession.LOGIN_CHECK_RESULT_TRUE);
				} else if (error === 'no_such_session') {
					_this2.logout();
					serverCheckCallback(CotSession.LOGIN_CHECK_RESULT_FALSE);
				} else {
					serverCheckCallback(CotSession.LOGIN_CHECK_RESULT_INDETERMINATE);
				}
			}).fail(function () {
				serverCheckCallback(CotSession.LOGIN_CHECK_RESULT_INDETERMINATE);
			});
		}
	}, {
		key: 'login',
		value: function login(options) {
			var _this3 = this;

			options = $.extend({
				'username': '',
				'password': '',
				'success': function success() {},
				'error': function error() {},
				'always': function always() {}
			}, options);

			var payload = {
				'app': this.options['appName'],
				'user': options['username'],
				'pwd': options['password']
			};

			var ajaxSettings = {
				'method': 'POST',
				'url': '' + this.options['ccApiOrigin'] + this.options['ccApiPath'] + this.options['ccApiEndpoint']
			};

			if (ajaxSettings['url'].indexOf('/c3api_auth/v2/AuthService.svc/AuthSet') !== -1) {
				ajaxSettings['contentType'] = 'application/json';
				ajaxSettings['data'] = JSON.stringify(payload);
			} else {
				ajaxSettings['data'] = payload;
			}

			$.ajax(ajaxSettings).done(function (data) {
				if (data['error']) {
					options['error'](null, data.error === 'invalid_user_or_pwd' ? 'Invalid username or password' : 'Login failed', data.error);
				} else if (data['passwordIsExpired']) {
					options['error'](null, 'Expired password', 'passwordIsExpired');
				} else {
					_this3._storeLogin(data);
					options['success']();
				}
			}).fail(function (jqXHR, textStatus, error) {
				options['error'](jqXHR, textStatus, error);
			}).always(function () {
				options['always']();
			});
		}
	}]);

	return ExtendedCotSession;
}(CotSession);

var PrototypeCopyCotLogin = function PrototypeCopyCotLogin() {
	_classCallCheck(this, PrototypeCopyCotLogin);
};

PrototypeCopyCotLogin.prototype = cot_login.prototype;

/* exported ExtendedCotLogin */

var ExtendedCotLogin = function (_PrototypeCopyCotLogi) {
	_inherits(ExtendedCotLogin, _PrototypeCopyCotLogi);

	// CONSTRUCTOR DEFINITION

	function ExtendedCotLogin() {
		var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

		_classCallCheck(this, ExtendedCotLogin);

		var _this4 = _possibleConstructorReturn(this, (ExtendedCotLogin.__proto__ || Object.getPrototypeOf(ExtendedCotLogin)).call(this));

		_this4.options = $.extend({
			appName: '',
			ccRoot: '',
			ccPath: '',
			ccEndpoint: '',
			welcomeSelector: '',
			loginMessage: '',
			onLogin: function onLogin() {}
		}, options);

		if (!_this4.options['appName']) {
			throw new Error('Error: the appName option is required');
		}

		_this4.session = new ExtendedCotSession({
			appName: _this4.options['appName'],
			ccApiOrigin: _this4.options['ccRoot'] || undefined,
			ccApiPath: _this4.options['ccPath'] || undefined,
			ccApiEndpoint: _this4.options['ccEndpoint'] || undefined
		});

		_this4._setUserName();
		return _this4;
	}

	// METHOD DEFINITION

	_createClass(ExtendedCotLogin, [{
		key: 'checkLogin',
		value: function checkLogin() {
			var _this5 = this;

			var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

			if (!options['serverSide']) {
				if (this.isLoggedIn()) {
					return Promise.resolve();
				} else {
					return Promise.reject();
				}
			}

			return new Promise(function (resolve, reject) {
				_this5.isLoggedIn(function (result) {
					if (result === CotSession.LOGIN_CHECK_RESULT_TRUE) {
						resolve();
					} else {
						reject();
					}
				});
			});
		}
	}, {
		key: 'isLoggedIn',
		value: function isLoggedIn(serverCheckCallback) {
			return this.session.isLoggedIn(serverCheckCallback);
		}
	}, {
		key: 'requireLogin',
		value: function requireLogin(options) {
			var _this6 = this;

			return Promise.resolve().then(function () {
				return _this6.checkLogin(options);
			}).catch(function () {
				return new Promise(function (resolve, reject) {
					_this6.showLogin($.extend({
						onHidden: function onHidden() {
							_this6.checkLogin(options).then(function () {
								resolve();
							}, function () {
								reject();
							});
						}
					}, options));
				});
			}).catch(function () {
				_this6.logout();
				return Promise.reject();
			});
		}
	}, {
		key: 'showLogin',
		value: function showLogin(options) {
			var _this7 = this;

			this.modal = cot_app.showModal($.extend({
				'body': '\n<form>\n\t<div class="form-group">\n\t\t<label for="cot_login_username">Username</label>:\n\t\t<input class="form-control" id="cot_login_username">\n\t</div>\n\t<div class="form-group">\n\t\t<label for="cot_login_password">Password</label>:\n\t\t<input class="form-control" type="password" id="cot_login_password">\n\t</div>\n</form>\n',

				'className': 'cot-login-modal',

				'footerButtonsHtml': '\n<button class="btn btn-primary btn-cot-login" type="button">Login</button>\n<button class="btn btn-default" type="button" data-dismiss="modal">Cancel</button>\n',

				'onShown': function onShown() {
					_this7.modal.find('.btn-cot-login').click(function () {
						_this7._login();
					});

					_this7.modal.find('.modal-body input').keydown(function (event) {
						if ((event.charCode || event.keyCode || 0) === 13) {
							_this7._login();
						}
					});
				},

				'originatingElement': $(this.options['welcomeSelector']).find('a.login'),

				'title': 'User Login'
			}, options));
		}
	}]);

	return ExtendedCotLogin;
}(PrototypeCopyCotLogin);