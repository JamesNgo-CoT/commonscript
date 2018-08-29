/* global moment */

/* exported DataModel */
const DataModel = Backbone.Model.extend({

	// PROPERTY DEFINITION

	attributeTypes: {
		'@odata.context': 'delete',
		'@odata.etag': 'delete',
		'__CreatedOn': 'delete',
		'__ModifiedOn': 'delete',
		'__Owner': 'delete'
	},

	syncNeedsLogin: false,

	url: function url() {
		const base = _.result(this, 'urlRoot') || _.result(this.collection, 'url');

		if (!base) {
			throw new Error('A "url" property or function must be specified');
		}

		if (this.isNew()) {
			return base;
		}

		return `${base.replace(/\/$/, '')}('${encodeURIComponent(this.get(this.idAttribute))}')`;
	},

	// METHOD DEFINITION

	parse: function parse(response, options) {
		const attributeTypes = _.result(this, 'attributeTypes');
		if (attributeTypes) {
			for (const key in attributeTypes) {
				if (response.hasOwnProperty(key) && response[key] != null) {
					switch (attributeTypes[key]) {
						case 'boolean':
							response[key] = response[key] ? 'true' : 'false';
							break;

						case 'number':
							if (!Number.isNaN(response[key])) {
								response[key] = String(Number(response[key]));
							}
							break;

						case 'string':
							response[key] = String(response[key]);
							break;

						case 'datetime':
							if (moment(response[key]).isValid()) {
								response[key] = moment(response[key]).format('YYYY-MM-DD h:mm:ss a');
							}
							break;

						case 'date':
							if (moment(response[key]).isValid()) {
								response[key] = moment(response[key]).format('YYYY-MM-DD');
							}
							break;
					}
				}
			}
		}

		return Backbone.Model.prototype.parse.call(this, response, options);
	},

	sync: function sync(method, model, options = {}) {
		options.contentType = 'application/json';

		if (method === 'create' || method === 'update') {
			options.data = $.extend(this.toJSON(options), options.data);

			const attributeTypes = _.result(this, 'attributeTypes');
			if (attributeTypes) {
				for (const key in attributeTypes) {
					if (options.data.hasOwnProperty(key) && options.data[key] != null) {
						switch (attributeTypes[key]) {
							case 'boolean':
								options.data[key] = options.data[key] === 'true';
								break;

							case 'number':
								if (!Number.isNaN(options.data[key])) {
									options.data[key] = Number(options.data[key]);
								}
								break;

							case 'string':
								options.data[key] = String(options.data[key]);
								break;

							case 'datetime':
								if (moment(options.data[key], 'YYYY/MM/DD h:mm:ss a').isValid()) {
									options.data[key] = moment(options.data[key], 'YYYY/MM/DD h:mm:ss a').format();
								}
								break;

							case 'date':
								if (moment(options.data[key], 'YYYY/MM/DD').isValid()) {
									options.data[key] = moment(options.data[key], 'YYYY/MM/DD').format();
								}
								break;

							case 'delete':
								delete options.data[key]
								break;
						}
					}
				}
			}

			options.data = JSON.stringify(options.data);
		}

		return Backbone.Model.prototype.sync.call(this, method, model, options);
	}
});
