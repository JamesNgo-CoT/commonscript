'use strict';

/* global moment */

/* exported DataTableView */
var DataTableView = Backbone.View.extend({

	// PROPERTY DEFINITION

	className: 'DataTableView',

	configuration: {
		columns: function columns() {
			return [DataTableView.columns.id];
		}
	},

	dataTable: null,

	template: _.template('<!-- datatable_view.template.html -->\n<div class="row">\n\t<div class="col-xs-12">\n\t\t<table width="100%" class="table table-bordered">\n\t\t\t<thead>\n\t\t\t\t<tr>\n\t\t\t\t<% for (var index = 0, length = configuration.columns.length; index < length; index++) { %>\n\t\t\t\t\t<th>\n\t\t\t\t\t\t<%- _.result(configuration.columns[index], \'title\') || _.result(configuration.columns[index], \'data\', \'\') %>\n\t\t\t\t\t</th>\n\t\t\t\t<% } %>\n\t\t\t\t</tr>\n\t\t\t\t<% if (configuration.showHeaderHtml !== false) { %>\n\t\t\t\t<tr>\n\t\t\t\t<% for (var index = 0, length = configuration.columns.length; index < length; index++) { %>\n\t\t\t\t\t<th class="<%- _.result(configuration.columns[index], \'className\', \'\') %>">\n\t\t\t\t\t\t<%= _.result($.extend({view: view }, configuration.columns[index]), \'headerHtml\', \'\') %>\n\t\t\t\t\t</th>\n\t\t\t\t<% } %>\n\t\t\t\t</tr>\n\t\t\t\t<% } %>\n\t\t\t</thead>\n\t\t\t<tbody></tbody>\n\t\t\t<% if (configuration.showFooterHtml !== false) { %>\n\t\t\t<tfoot>\n\t\t\t\t<tr>\n\t\t\t\t<% for (var index = 0, length = configuration.columns.length; index < length; index++) { %>\n\t\t\t\t\t<td class="<%- _.result(configuration.columns[index], \'className\', \'\') %>">\n\t\t\t\t\t\t<%= _.result($.extend({view: view }, configuration.columns[index]), \'footerHtml\', \'\') %>\n\t\t\t\t\t</td>\n\t\t\t\t<% } %>\n\t\t\t\t</tr>\n\t\t\t</tfoot>\n\t\t\t<% } %>\n\t\t</table>\n\t</div>\n</div>\n'),

	// METHOD DEFINITION

	reload: function reload(callback) {
		var resetPaging = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

		if (this.dataTable) {
			this.dataTable.ajax.reload(callback, resetPaging);
		}
	},

	remove: function remove() {
		this.removeDataTable();
		Backbone.View.prototype.remove.call(this);
	},

	removeDataTable: function removeDataTable() {
		if (this.dataTable) {
			this.dataTable.destroy();
		}
	},

	render: function render() {
		var _this = this;

		var configuration = _.result(this, 'configuration');
		var columns = configuration.columns = _.result(configuration, 'columns');

		return Promise.resolve(this.removeDataTable()).then(function () {

			// PRE-RENDER
			var preRenderPromises = [];
			for (var index = 0, length = columns.length; index < length; index++) {
				var column = columns[index];
				if (column['preRender']) {
					preRenderPromises.push(column['preRender'](column, configuration, _this));
				}
			}

			return Promise.all(preRenderPromises);
		}).then(function () {

			// RENDER TEMPLATE
			_this.$el.html(_this.template({ configuration: configuration, view: _this }));
		}).then(function () {

			// RENDER DATATABLE
			var dt_configuration = $.extend({
				orderCellsTop: true
			}, configuration);

			if (configuration['serverSide'] === true) {
				$.extend(dt_configuration, {
					ajax: function ajax(data, callback) {
						// TODO.
						// const defaultFetchParameters = _.result(this.collection, 'fetchParameters');

						var fetchParameters = {};

						// $count
						fetchParameters['$count'] = true;

						// $filter
						var $filter = data.columns.filter(function (value) {
							return value.searchable && value.search && value.search.value;
						}).map(function (value) {
							return value.search.value;
						}).join(' and ');
						if ($filter) {
							fetchParameters['$filter'] = $filter;
						}

						// $orderby
						var $orderby = data.order.map(function (value) {
							return data.columns[value.column].data + ' ' + value.dir;
						}).join(',');
						if ($orderby) {
							fetchParameters['$orderby'] = $orderby;
						}

						// $search
						if (data.search && data.search.value) {
							fetchParameters['$search'] = '"' + data.search.value + '"';
						}

						// $select
						// NOTE: $select is problematic. C3API does not like undefined columns.

						// $skip
						fetchParameters['$skip'] = data.start;

						// $top
						fetchParameters['$top'] = data.length;

						var complete = function complete() {
							callback({
								data: _this.collection.toJSON({ transform: false }),
								draw: data.draw,
								recordsTotal: _this.collection.totalRecords || 0,
								recordsFiltered: _this.collection.totalRecords || 0
							});
						};

						_this.collection.fetch({
							fetchParameters: fetchParameters
						}).then(complete, complete);
					}
				});
			} else {
				$.extend(dt_configuration, {
					data: _this.collection.toJSON()
				});
			}

			_this.dataTable = _this.$el.find('table').DataTable(dt_configuration);
		}).then(function () {

			// Post Render and Event.
			var postRenderPromises = [];
			for (var index = 0, length = columns.length; index < length; index++) {

				var column = columns[index];
				if (column['postRender']) {
					postRenderPromises.push(column['postRender'](column, _this.configuration, _this));
				}

				if (column['events'] != null) {
					if (_this.events == null) {
						_this.events = {};
					}

					var events = _.result($.extend({ view: _this }, column), 'events');
					for (var key in events) {
						_this.events[key] = events[key];
					}
				}
			}

			_this.delegateEvents();

			return Promise.all(postRenderPromises);
		}).catch(function (error) {
			if (error) {
				alert('An error occured. ' + error);
				/* eslint-disable no-console */
				if (window.console && console.error) {
					console.error(error);
				}
				/* eslint-enable no-console */
			}
		});
	}
}, {

	//////////////////////////////////////////////////////////////////////////////
	// BUTTONS CONFIGURATION
	//////////////////////////////////////////////////////////////////////////////

	buttonsConfiguration: {
		buttons: [{
			extend: 'copyHtml5',
			exportOptions: { columns: ':visible:not(.excludeFromButtons)' }
		}, {
			extend: 'csvHtml5',
			exportOptions: { columns: ':visible:not(.excludeFromButtons)' }
		}, {
			extend: 'excelHtml5',
			exportOptions: { columns: ':visible:not(.excludeFromButtons)' }
		}, {
			extend: 'pdfHtml5',
			exportOptions: { columns: ':visible:not(.excludeFromButtons)' }
		}, {
			extend: 'print',
			exportOptions: { columns: ':visible:not(.excludeFromButtons)' }
		}],

		dom: '<\'row\'<\'col-sm-6\'l><\'col-sm-6\'f>><\'row\'<\'col-sm-12\'<\'table-responsive\'tr>>><\'row\'<\'col-sm-5\'i><\'col-sm-7\'p>>B'
	},

	//////////////////////////////////////////////////////////////////////////////
	// COLUMN FILTERS
	//////////////////////////////////////////////////////////////////////////////

	columnFilters: {
		'booleanEquals': function booleanEquals(serverSide, value, dtColumn) {
			var search = '';

			if (value) {
				if (serverSide) {
					if (value === '$EMPTY') {
						search = dtColumn.dataSrc() + ' eq null';
					} else if (value === '$NOTEMPTY') {
						search = dtColumn.dataSrc() + ' ne null';
					} else if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
						search = dtColumn.dataSrc() + ' eq ' + value.toLowerCase();
					}
				} else {
					search = value;
				}
			}

			if (search !== dtColumn.search()) {
				dtColumn.search(search);
				dtColumn.draw();
			}
		},

		'numberEquals': function numberEquals(serverSide, value, dtColumn) {
			var search = '';

			if (value) {
				if (serverSide) {
					if (value === '$EMPTY') {
						search = dtColumn.dataSrc() + ' eq null';
					} else if (value === '$NOTEMPTY') {
						search = dtColumn.dataSrc() + ' ne null';
					} else if (!isNaN(value)) {
						search = dtColumn.dataSrc() + ' eq ' + value.toLowerCase();
					}
				} else {
					search = value;
				}
			}

			if (search !== dtColumn.search()) {
				dtColumn.search(search);
				dtColumn.draw();
			}
		},

		'numberBetween': function numberBetween(serverSide, value, dtColumn) {
			var search = '';

			if (value) {
				if (serverSide) {
					if (value === '$EMPTY') {
						search = dtColumn.dataSrc() + ' eq null';
					} else if (value === '$NOTEMPTY') {
						search = dtColumn.dataSrc() + ' ne null';
					} else if (value.toLowerCase().indexOf('to') !== -1) {
						var nums = value.toLowerCase().split('to');
						if (!isNaN(nums[0]) || !isNaN(nums[0])) {
							var searches = [];
							if (!isNaN(nums[0])) {
								searches[0] = dtColumn.dataSrc() + ' ge ' + nums[0];
							} else {
								searches[0] = null;
							}
							if (!isNaN(nums[1])) {
								searches[1] = dtColumn.dataSrc() + ' le ' + nums[1];
							} else {
								searches[1] = null;
							}
							search = searches.filter(function (val) {
								return val;
							}).join(' and ');
						}
					}
				} else {
					search = value;
				}
			}

			if (search !== dtColumn.search()) {
				dtColumn.search(search);
				dtColumn.draw();
			}
		},

		'stringEquals': function stringEquals(serverSide, value, dtColumn) {
			var search = '';

			if (value) {
				if (serverSide) {
					if (value === '$EMPTY') {
						search = dtColumn.dataSrc() + ' eq null';
					} else if (value === '$NOTEMPTY') {
						search = dtColumn.dataSrc() + ' ne null';
					} else {
						search = 'tolower(' + dtColumn.dataSrc() + ') eq \'' + value.toLowerCase() + '\'';
					}
				} else {
					search = value;
				}
			}

			if (search !== dtColumn.search()) {
				dtColumn.search(search);
				dtColumn.draw();
			}
		},

		'stringContains': function stringContains(serverSide, value, dtColumn) {
			var search = '';

			if (value) {
				if (serverSide) {
					if (value === '$EMPTY') {
						search = dtColumn.dataSrc() + ' eq null';
					} else if (value === '$NOTEMPTY') {
						search = dtColumn.dataSrc() + ' ne null';
					} else {
						var words = value.toLowerCase().split(' ');
						var searches = [];
						for (var i = 0, l = words.length; i < l; i++) {
							searches.push('contains(tolower(' + dtColumn.dataSrc() + '),\'' + words[i] + '\')');
						}
						search = searches.join(' and ');
					}
				} else {
					search = value;
				}
			}

			if (search !== dtColumn.search()) {
				dtColumn.search(search);
				dtColumn.draw();
			}
		},
		// },

		'dateEquals': function dateEquals(serverSide, value, dtColumn) {
			var search = '';

			if (value) {
				if (serverSide) {
					if (value === '$EMPTY') {
						search = dtColumn.dataSrc() + ' eq null';
					} else if (value === '$NOTEMPTY') {
						search = dtColumn.dataSrc() + ' ne null';
					} else if (moment(value, 'l').isValid()) {
						var start = moment(value, 'l').set({
							hour: 0,
							minute: 0,
							second: 0,
							millisecond: 0
						}).format();
						var end = moment(start).add({
							hours: 24
						}).format();
						search = dtColumn.dataSrc() + ' ge ' + start + ' and ' + dtColumn.dataSrc() + ' le ' + end;
					}
				} else {
					search = value;
				}
			}

			if (search !== dtColumn.search()) {
				dtColumn.search(search);
				dtColumn.draw();
			}
		},

		'dateBetween': function dateBetween(serverSide, value, dtColumn) {
			var search = '';

			if (value) {
				if (serverSide) {
					if (value === '$EMPTY') {
						search = dtColumn.dataSrc() + ' eq null';
					} else if (value === '$NOTEMPTY') {
						search = dtColumn.dataSrc() + ' ne null';
					} else if (value.toLowerCase().indexOf('to') !== -1) {
						var dates = value.toLowerCase().split('to');
						if (moment(dates[0]).isValid() || moment(dates[1]).isValid()) {
							var searches = [];
							if (moment(dates[0]).isValid()) {
								var start = moment(dates[0]).set({
									hour: 0,
									minute: 0,
									second: 0,
									millisecond: 0
								}).format();
								searches[0] = dtColumn.dataSrc() + ' ge ' + start;
							} else {
								searches[0] = null;
							}
							if (moment(dates[1]).isValid()) {
								var end = moment(dates[1]).set({
									hour: 0,
									minute: 0,
									second: 0,
									millisecond: 0
								}).add({
									hours: 24
								}).format();
								searches[1] = dtColumn.dataSrc() + ' le ' + end;
							} else {
								searches[1] = null;
							}
							search = searches.filter(function (val) {
								return val;
							}).join(' and ');
						}
					}
				} else {
					search = value;
				}
			}

			if (search !== dtColumn.search()) {
				dtColumn.search(search);
				dtColumn.draw();
			}
		}
	},

	//////////////////////////////////////////////////////////////////////////////
	// COLUMNS
	//////////////////////////////////////////////////////////////////////////////

	columns: {
		'id': {
			data: 'id',
			title: 'ID'
		}
	},

	//////////////////////////////////////////////////////////////////////////////
	// PRE RENDERS
	//////////////////////////////////////////////////////////////////////////////

	preRenders: {
		'filterHtmlFactory': function filterHtmlFactory(columnFilter) {
			if (typeof columnFilter === 'string') {
				columnFilter = DataTableView.columnFilters[columnFilter];
			}
			return function (column, configuration, view) {
				return Promise.resolve().then(function () {
					if (column.choices && typeof column.choices === 'string') {
						return new Promise(function (resolve) {
							var url = column.choices;
							column.choices = [];
							$.getJSON(url).then(function (data) {
								if (Array.isArray(data)) {
									column.choices = data;
								}
								resolve();
							}, function () {
								resolve();
							});
						});
					}
				}).then(function () {
					if (column.choices) {
						if (column.choices.length === 0 || column.choices[0].value != null && column.choices[0].value !== '' || column.choices[0].value == null && column.choices[0].text !== '') {
							column.choices.unshift({ text: '' });
						}
						column.headerHtml = '\n\t\t\t\t\t\t\t\t<label class="sr-only" for="' + column.data + '_header_' + view.cid + '">Filter ' + (column.title || column.data) + '</label>\n\t\t\t\t\t\t\t\t<select class="form-control" id="' + column.data + '_header_' + view.cid + '">\n\t\t\t\t\t\t\t\t\t' + column.choices.map(function (choice) {
							return '<option value="' + (choice.value != null ? choice.value : choice.text) + '">' + choice.text + '</option>';
						}).join('') + '\n\t\t\t\t\t\t\t\t</select>\n\t\t\t\t\t\t\t';
						column.footerHtml = '\n\t\t\t\t\t\t\t\t<label class="sr-only" for="' + column.data + '_footer_' + view.cid + '">Filter ' + (column.title || column.data) + '</label>\n\t\t\t\t\t\t\t\t<select class="form-control" id="' + column.data + '_footer_' + view.cid + '">\n\t\t\t\t\t\t\t\t\t' + column.choices.map(function (choice) {
							return '<option value="' + (choice.value != null ? choice.value : choice.text) + '">' + choice.text + '</option>';
						}).join('') + '\n\t\t\t\t\t\t\t\t</select>\n\t\t\t\t\t\t\t';
					} else {
						column.headerHtml = '\n\t\t\t\t\t\t\t\t<label class="sr-only" for="' + column.data + '_header_' + view.cid + '">Filter ' + (column.title || column.data) + '</label>\n\t\t\t\t\t\t\t\t<input type="text" class="form-control" id="' + column.data + '_header_' + view.cid + '">\n\t\t\t\t\t\t\t';
						column.footerHtml = '\n\t\t\t\t\t\t\t\t<label class="sr-only" for="' + column.data + '_footer_' + view.cid + '">Filter ' + (column.title || column.data) + '</label>\n\t\t\t\t\t\t\t\t<input type="text" class="form-control" id="' + column.data + '_footer_' + view.cid + '">\n\t\t\t\t\t\t\t';
					}

					if (!column.events) {
						column.events = {};
					}

					var synceValue = function synceValue(value) {
						var $headerInput = $('#' + column.data + '_header_' + view.cid);
						if ($headerInput.val() !== value) {
							$headerInput.val(value);
						}
						var $footerInput = $('#' + column.data + '_footer_' + view.cid);
						if ($footerInput.val() !== value) {
							$footerInput.val(value);
						}
					};

					var changeHandler = function changeHandler(event) {
						var $input = $(event.target);
						var value = $input.val();
						var index = $input.closest('tr').children('td, th').index($input.closest('td, th'));
						synceValue(value);
						columnFilter(configuration.serverSide, value, view.dataTable.column(index));
					};
					column.events['change #' + column.data + '_header_' + view.cid] = changeHandler;
					column.events['change #' + column.data + '_footer_' + view.cid] = changeHandler;

					var keyupHandler = function keyupHandler(event) {
						var $input = $(event.target);
						var value = $input.val();
						var index = $input.closest('tr').children('td, th').index($input.closest('td, th'));
						synceValue(value);
						columnFilter(configuration.serverSide, value, view.dataTable.column(index));
					};
					column.events['keyup #' + column.data + '_header_' + view.cid] = keyupHandler;
					column.events['keyup #' + column.data + '_footer_' + view.cid] = keyupHandler;
				});
			};
		}
	}
});