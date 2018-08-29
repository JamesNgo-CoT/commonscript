'use strict';

/* exported BaseRouter */
var BaseRouter = Backbone.Router.extend({

	// PROPERTY DEFINITION

	homeFragment: null,

	lastFragment: null,

	routes: {
		'*default': 'defautRoute'
	},

	// METHOD DEFINITION

	defautRoute: function defautRoute() {
		if (this.lastFragment != null) {
			this.navigate(this.lastFragment, { trigger: false });
		} else if (this.homeRoute != null) {
			this.navigate(this.homeFragment, { trigger: true });
		}
	},

	route: function route(_route, name, callback) {
		var _this = this;

		var oldCallback = callback || typeof name === 'function' ? name : this[name];
		if (oldCallback !== this.defautRoute) {
			var newCallback = function newCallback() {
				for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
					args[_key] = arguments[_key];
				}

				_this.lastFragment = Backbone.history.fragment;
				oldCallback.call.apply(oldCallback, [_this].concat(args));
			};

			if (callback) {
				callback = newCallback;
			} else if (typeof name === 'function') {
				name = newCallback;
			} else {
				this[name] = newCallback;
			}
		}

		return Backbone.Router.prototype.route.call(this, _route, name, callback);
	}
});