/* exported LoginButtonView */
const LoginButtonView = Backbone.View.extend({

	// PROPERTY DEFINITION

	className: 'LoginButtonView',

	events: {
		'click .btn-login': function (event) {
			event.preventDefault();
			this.doLogin();
		},

		'click .btn-logout': function (event) {
			event.preventDefault();
			this.doLogout();
		}
	},

	login: null,

	tagName: 'form',

	template: _.template(`{{> loginbutton_view.template.html }}`),

	// METHOD DEFINITION

	doLogin: function () {
		this.login.showLogin({
			originatingElement: $('button', this.$el),
			onHidden: () => {
				this.login.checkLogin().then(() => {
					Backbone.history.stop();
					Backbone.history.start();
				}, () => {
					if (this.login.sid) {
						this.login.logout();
					}
				});
			}
		});
	},

	doLogout: function () {
		this.login.logout();
	},

	render: function () {
		this.$el.html(this.template({
			cotLogin: this.login
		}));
	}
});
