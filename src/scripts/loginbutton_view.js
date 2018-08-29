/* exported LoginButtonView */
const LoginButtonView = Backbone.View.extend({

	// PROPERTY DEFINITION

	className: 'LoginButtonView',

	events: {
		'click .btn-login': 'doLogin',
		'click .btn-logout': 'doLogout'
	},

	tagName: 'form',

	template: _.template(`{{> loginbutton_view.template.html }}`),

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
