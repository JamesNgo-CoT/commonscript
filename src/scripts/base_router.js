/* exported BaseRouter */
const BaseRouter = Backbone.Router.extend({

	// PROPERTY DEFINITION

	homeFragment: null,

	lastFragment: null,

	routes: {
		'*default': 'defautRoute'
	},

	// METHOD DEFINITION

	defautRoute: function () {
		if (this.lastFragment != null) {
			this.navigate(this.lastFragment, { trigger: false });
		} else if (this.homeRoute != null) {
			this.navigate(this.homeFragment, { trigger: true });
		}
	},

	route: function (route, name, callback) {
		const oldCallback = callback || (typeof name === 'function') ? name : this[name];
		if (oldCallback !== this.defautRoute) {
			const newCallback = (...args) => {
				this.lastFragment = Backbone.history.fragment;
				oldCallback.call(this, ...args);
			}

			if (callback) {
				callback = newCallback;
			} else if (typeof name === 'function') {
				name = newCallback;
			} else {
				this[name] = newCallback;
			}
		}

		return Backbone.Router.prototype.route.call(this, route, name, callback);
	}
});
