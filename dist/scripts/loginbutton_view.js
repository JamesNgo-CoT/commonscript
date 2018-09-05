'use strict';

/* exported LoginButtonView */
var LoginButtonView = Backbone.View.extend({

	// PROPERTY DEFINITION

	className: 'LoginButtonView',

	events: {
		'click .btn-login': 'doLogin',
		'click .btn-logout': 'doLogout'
	},

	tagName: 'form',

	template: function template(options) {
		if (options.cotLogin.sid) {
			return '\n\t\t\t\t<button type="button" class="btn btn-default btn-logout hidden-print">\n\t\t\t\t\tLogout:\n\t\t\t\t\t<strong>\n\t\t\t\t\t\t' + ([options.cotLogin.lastName, options.cotLogin.firstName].filter(function (value) {
				return value;
			}).join(', ') || '') + '\n\t\t\t\t\t</strong>\n\t\t\t\t</button>\n\t\t\t';
		} else {
			return '<button type="button" class="btn btn-default btn-login hidden-print">Login</button>';
		}
	},

	// METHOD DEFINITION

	doLogin: function doLogin(event) {
		event.preventDefault();
		var $originatingElement = $('button', this.$el);
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