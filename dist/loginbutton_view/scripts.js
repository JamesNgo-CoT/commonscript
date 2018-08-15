'use strict';

/* exported LoginButtonView */
var LoginButtonView = Backbone.View.extend({

	// PROPERTY DEFINITION

	className: 'LoginButtonView',

	tagName: 'form',

	template: _.template('<!-- scripts.template html -->\n<% if (cotLogin.sid) { %>\n<button type="button" class="btn btn-default btn-logout hidden-print">\n\tLogout: <strong><%- [cotLogin.lastName, cotLogin.firstName].filter((value) => value).join(\', \') || \'\' %></strong>\n</button>\n <% } else { %>\n<button type="button" class="btn btn-default btn-login hidden-print">\n\tLogin\n</button>\n <% } %>\n'),

	// EVENT HANDLER DEFINITION

	events: {
		'click .btn-login': function clickBtnLogin(event) {
			event.preventDefault();
			this.trigger('login', event.currentTarget);
		},

		'click .btn-logout': function clickBtnLogout(event) {
			event.preventDefault();
			this.trigger('logout');
		}
	},

	// METHOD DEFINITION

	render: function render(cotLogin) {
		this.$el.html(this.template({
			cotLogin: cotLogin
		}));
	}
});