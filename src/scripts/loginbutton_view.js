/* exported LoginButtonView */
const LoginButtonView = Backbone.View.extend({

	// PROPERTY DEFINITION

	className: 'LoginButtonView',

	events: {
		'click .btn-login': 'doLogin',
		'click .btn-logout': 'doLogout'
	},

	tagName: 'form',

	template: (options) => {
		if (options.cotLogin.sid) {
			return `
				<button type="button" class="btn btn-default btn-logout hidden-print">
					Logout:
					<strong>
						${[options.cotLogin.lastName, options.cotLogin.firstName].filter((value) => value).join(', ') || ''}
					</strong>
				</button>
			`;
		} else {
			return '<button type="button" class="btn btn-default btn-login hidden-print">Login</button>';
		}
	},

	// METHOD DEFINITION

	doLogin: function doLogin(event) {
		event.preventDefault();
		const $originatingElement = $('button', this.$el);
		this.trigger('login', $originatingElement);
	},

	doLogout: function doLogout(event) {
		event.preventDefault();
		this.trigger('logout');
	},

	render: function render(extendedCotLogin) {
		this.$el.html(this.template({
			cotLogin: extendedCotLogin
		}));
	}
});
