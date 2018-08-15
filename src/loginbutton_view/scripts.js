
/* exported LoginButtonView */
const LoginButtonView = Backbone.View.extend({

	// PROPERTY DEFINITION

	className: 'LoginButtonView',

	tagName: 'form',

	template: _.template(`{{> scripts.template.html }}`),

	// EVENT HANDLER DEFINITION

	events: {
		'click .btn-login': function (event) {
			event.preventDefault();
			this.trigger('login', event.currentTarget);
		},

		'click .btn-logout': function (event) {
			event.preventDefault();
			this.trigger('logout');
		}
	},

	// METHOD DEFINITION

	render: function (cotLogin) {
		this.$el.html(this.template({
			cotLogin: cotLogin
		}));
	}
});
