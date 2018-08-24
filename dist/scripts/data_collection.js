'use strict';

/* global DataModel queryObjectToString */

/* exported DataCollection */
var DataCollection = Backbone.Collection.extend({

	// PROPERTY DEFINITION

	syncNeedsLogin: false,

	fetchAll: false,

	fetchParameters: {
		$count: false
	},

	model: function model() {
		for (var _len = arguments.length, arg = Array(_len), _key = 0; _key < _len; _key++) {
			arg[_key] = arguments[_key];
		}

		return new (Function.prototype.bind.apply(DataModel, [null].concat(arg)))();
	},

	totalRecords: null,

	// METHOD DEFINITION

	fetch: function fetch() {
		var _this = this;

		var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

		this.totalRecords = null;

		var fetchParameters = $.extend({}, _.result(this, 'fetchParameters'), _.result(options, 'fetchParameters'));
		var fetchAll = _.result(options, 'fetchAll', _.result(this, 'fetchAll', false));
		if (fetchAll) {
			fetchParameters['$count'] = true;
			fetchParameters['$skip'] = 0;
			fetchParameters['$top'] = 1;
		}

		var queryString = queryObjectToString(fetchParameters);
		options['url'] = [_.result(this, 'url'), queryString].join('?');

		return Backbone.Collection.prototype.fetch.call(this, options).then(function () {
			if (fetchAll && _this.totalRecords > 1 && fetchParameters['$count'] === true && _this.totalRecords != null) {
				return _this.fetch($.extend(options, {
					fetchParameters: $.extend(_.result(options, 'fetchParameters'), {
						$skip: 0,
						$top: _this.totalRecords
					})
				}));
			}
		});
	},

	parse: function parse(response, options) {
		if (response && !Array.isArray(response)) {
			if (response['@odata.count']) {
				this.totalRecords = response['@odata.count'];
			}

			if (!Array.isArray(response) && response.hasOwnProperty('value')) {
				response = response['value'];
			}
		}

		return Backbone.Collection.prototype.parse.call(this, response, options);
	}
});