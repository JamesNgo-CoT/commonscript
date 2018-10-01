'use strict';

/* exported LoginButtonView */
/**
 * A Backbone view class for the app's login button.
 */
var LoginButtonView = Backbone.View.extend({

	// PROPERTY DEFINITION

	className: 'LoginButtonView',

	cotLogin: null,

	events: {
		'click .btn-login': 'doLogin',
		'click .btn-logout': 'doLogout'
	},

	tagName: 'form',

	// METHOD DEFINITION

	/**
  * Handles login.
  */
	doLogin: function doLogin(event) {
		var _this = this;

		event.preventDefault();

		this.cotLogin.showLogin({
			originatingElement: $('button', this.$el),
			onHidden: function onHidden() {
				_this.cotLogin.checkLogin().then(function () {
					_this.render();
					Backbone.history.stop();
					Backbone.history.start();
				}, function () {
					_this.render();
					if (_this.cotLogin.sid) {
						_this.cotLogin.logout();
					}
				});
			}
		});
	},

	/**
  * Handles logout.
  */
	doLogout: function doLogout(event) {
		event.preventDefault();
		if (this.cotLogin != null) {
			this.cotLogin.logout();
		}
	},

	/**
  * Renders the login button.
  * @param {ExtendedCotLogin} cotLogin
  */
	render: function render(cotLogin) {
		this.cotLogin = cotLogin || this.cotLogin;
		if (this.cotLogin != null && this.cotLogin.sid != null && this.cotLogin.sid != '') {
			var signedInUser = [this.cotLogin.lastName, this.cotLogin.firstName].filter(function (value) {
				return value;
			}).join(', ') || '';
			this.$el.html('<button type="button" class="btn btn-default btn-logout hidden-print">Logout: <strong>' + signedInUser + '</strong></button>');
		} else {
			this.$el.html('<button type="button" class="btn btn-default btn-login hidden-print">Login</button>');
		}
	}
});