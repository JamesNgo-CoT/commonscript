/* exported LoginButtonView */
/**
 * A Backbone view class for the app's login button.
 */
const LoginButtonView = Backbone.View.extend({

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
		event.preventDefault();

		this.cotLogin.showLogin({
			originatingElement: $('button', this.$el),
			onHidden: () => {
				this.cotLogin.checkLogin().then(() => {
					this.render();
					Backbone.history.stop();
					Backbone.history.start();
				}, () => {
					this.render();
					if (this.cotLogin.sid) {
						this.cotLogin.logout();
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
			const signedInUser = [this.cotLogin.lastName, this.cotLogin.firstName].filter((value) => value).join(', ') || '';
			this.$el.html(`<button type="button" class="btn btn-default btn-logout hidden-print">Logout: <strong>${signedInUser}</strong></button>`);
		} else {
			this.$el.html('<button type="button" class="btn btn-default btn-login hidden-print">Login</button>');
		}
	}
});
