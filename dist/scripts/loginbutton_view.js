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

	template: _.template('<!-- scripts.template html -->\n<% if (cotLogin.sid) { %>\n\t<button type="button" class="btn btn-default btn-logout hidden-print">\n\t\tLogout: <strong><%- [cotLogin.lastName, cotLogin.firstName].filter((value) => value).join(\', \') || \'\' %></strong>\n\t</button>\n<% } else { %>\n\t<button type="button" class="btn btn-default btn-login hidden-print">\n\t\tLogin\n\t</button>\n<% } %>\n'),

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