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

	template: function template(options) {
		function getHeaders() {
			var returnValue = [];
			for (var index = 0, length = options.configuration.columns.length; index < length; index++) {
				returnValue.push('\n\t\t\t\t\t<th>\n\t\t\t\t\t\t' + (_.result(options.configuration.columns[index], 'title') || _.result(options.configuration.columns[index], 'data', '')) + '\n\t\t\t\t\t</th>\n\t\t\t\t');
			}
			return returnValue.join('');
		}

		function getHeaderFilters() {
			var returnValue = [];
			if (options.configuration.showHeaderHtml !== false) {
				returnValue.push('<tr>');
				for (var index = 0, length = options.configuration.columns.length; index < length; index++) {
					returnValue.push('\n\t\t\t\t\t\t<th data-index="' + index + '" class="' + _.result(options.configuration.columns[index], 'className', '') + '">\n\t\t\t\t\t\t\t' + _.result($.extend({ view: options.view }, options.configuration.columns[index]), 'headerHtml', '') + '\n\t\t\t\t\t\t</th>\n\t\t\t\t\t');
				}
				returnValue.push('</tr>');
			}
			return returnValue.join('');
		}

		function getFooterFilters() {
			var returnValue = [];
			if (options.configuration.showFooterHtml !== false) {
				returnValue.push('<tfoot>');
				returnValue.push('<tr>');
				for (var index = 0, length = options.configuration.columns.length; index < length; index++) {
					returnValue.push('\n\t\t\t\t\t\t<td data-index="' + index + '" class="' + _.result(options.configuration.columns[index], 'className', '') + '">\n\t\t\t\t\t\t\t' + _.result($.extend({ view: options.view }, options.configuration.columns[index]), 'footerHtml', '') + '\n\t\t\t\t\t\t</td>\n\t\t\t\t\t');
				}
				returnValue.push('</tr>');
				returnValue.push('</tfoot>');
			}
			return returnValue.join('');
		}

		var returnValue = '\n\t\t\t<div class="row">\n\t\t\t\t<div class="col-xs-12">\n\t\t\t\t\t<table width="100%" class="table table-bordered">\n\t\t\t\t\t\t<thead>\n\t\t\t\t\t\t\t<tr>\n\t\t\t\t\t\t\t\t' + getHeaders() + '\n\t\t\t\t\t\t\t</tr>\n\t\t\t\t\t\t\t' + getHeaderFilters() + '\n\t\t\t\t\t\t</thead>\n\t\t\t\t\t\t<tbody></tbody>\n\t\t\t\t\t\t' + getFooterFilters() + '\n\t\t\t\t\t</table>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t';

		return returnValue;
	},

	// METHOD DEFINITION

	resetFilters: function resetFilters() {
		$('tfoot input[type="text"], thead input[type="text"]', this.$el).each(function (index, element) {
			$(element).val($(element).attr('value') || '').change();
		});
		$('tfoot select, thead select', this.$el).each(function (index, element) {
			var $option = $(element).find('[selected]');
			var value = $option.attr('value');
			$(element).val(value != null ? value : $option.text()).change();
		});
		this.dataTable.search('').draw();
	},

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
		var serverSide = configuration.serverSide = _.result(configuration, 'serverSide');

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

			if (serverSide === true) {
				$.extend(dt_configuration, {
					ajax: function ajax(data, callback) {

						// if (this.draw == null) {
						// 	this.draw = 0;
						// }

						// data.draw = this.draw;
						// this.draw = this.draw + 1;


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
							var orderBy = data.columns[value.column].data;

							var configOrderBy = _.result(configuration.columns[value.column], 'orderBy');
							var configDataType = _.result(configuration.columns[value.column], 'dataType');

							if (configOrderBy) {
								orderBy = configOrderBy;
							} else if (configDataType) {
								if (configDataType === 'string') {
									orderBy = 'tolower(' + orderBy + ')';
								}
							}

							return orderBy + ' ' + value.dir;
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
						/*
      	$.ajax({
      	url: '...?' + query string
      })
      */
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
		}).then(function () {
			$('thead input, thead select, tfoot input, tfoot select', _this.$el).change();
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

	buttonsConfiguration: function buttonsConfiguration() {
		return {
			buttons: [{
				extend: 'copyHtml5',
				exportOptions: { columns: ':visible:not(.excludeFromButtons)' },
				title: this.title
			}, {
				extend: 'csvHtml5',
				exportOptions: { columns: ':visible:not(.excludeFromButtons)' },
				title: this.title
			}, {
				extend: 'excelHtml5',
				exportOptions: { columns: ':visible:not(.excludeFromButtons)' },
				title: this.title
			}, {
				extend: 'pdfHtml5',
				exportOptions: { columns: ':visible:not(.excludeFromButtons)' },
				title: this.title
			}, {
				extend: 'print',
				exportOptions: { columns: ':visible:not(.excludeFromButtons)' },
				title: this.title
			}],

			dom: '<\'row\'<\'col-sm-6\'l><\'col-sm-6\'f>><\'row\'<\'col-sm-12\'<\'table-responsive\'tr>>><\'row\'<\'col-sm-5\'i><\'col-sm-7\'p>>B'
		};
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
						// search = `tolower(${dtColumn.dataSrc()}) eq '${value.toLowerCase().replace('\'', '\'\'')}'`;
						search = dtColumn.dataSrc() + ' eq \'' + value.replace("'", "''") + '\'';
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
							searches.push('contains(tolower(' + dtColumn.dataSrc() + '),\'' + words[i].toLowerCase().replace('\'', '\'\'') + '\')');
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
						// console.log('DATES', dates);
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
		'filterHtmlFactory': function filterHtmlFactory(columnFilter, defaultValue) {
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
						column.choices[0].text = column.filterLabel || 'Filter by ' + column.title;
						column.choices[0].value = '';
						column.headerHtml = '\n\t\t\t\t\t\t\t<label class="sr-only" for="' + column.data + '_header_' + view.cid + '">Filter ' + (column.title || column.data) + '</label>\n\t\t\t\t\t\t\t<select class="form-control" id="' + column.data + '_header_' + view.cid + '">\n\t\t\t\t\t\t\t\t' + column.choices.map(function (choice) {
							return '<option value="' + (choice.value != null ? choice.value : choice.text) + '"' + (choice.value != null && choice.value === defaultValue || choice.value == null && choice.text === defaultValue ? ' selected' : '') + '>' + choice.text + '</option>';
						}).join('') + '\n\t\t\t\t\t\t\t</select>\n\t\t\t\t\t\t';
						column.footerHtml = '\n\t\t\t\t\t\t\t<label class="sr-only" for="' + column.data + '_footer_' + view.cid + '">Filter ' + (column.title || column.data) + '</label>\n\t\t\t\t\t\t\t<select class="form-control" id="' + column.data + '_footer_' + view.cid + '">\n\t\t\t\t\t\t\t\t' + column.choices.map(function (choice) {
							return '<option value="' + (choice.value != null ? choice.value : choice.text) + '"' + (choice.value != null && choice.value === defaultValue || choice.value == null && choice.text === defaultValue ? ' selected' : '') + '>' + choice.text + '</option>';
						}).join('') + '\n\t\t\t\t\t\t\t</select>\n\t\t\t\t\t\t';
					} else {
						column.headerHtml = '\n\t\t\t\t\t\t\t<label class="sr-only" for="' + column.data + '_header_' + view.cid + '">Filter ' + (column.title || column.data) + '</label>\n\t\t\t\t\t\t\t<input type="text" class="form-control" id="' + column.data + '_header_' + view.cid + '"' + (defaultValue ? ' value="' + defaultValue + '"' : '') + ' placeholder="' + (column.filterLabel || 'Filter by ' + column.title) + '">\n\t\t\t\t\t\t';
						column.footerHtml = '\n\t\t\t\t\t\t\t<label class="sr-only" for="' + column.data + '_footer_' + view.cid + '">Filter ' + (column.title || column.data) + '</label>\n\t\t\t\t\t\t\t<input type="text" class="form-control" id="' + column.data + '_footer_' + view.cid + '"' + (defaultValue ? ' value="' + defaultValue + '"' : '') + ' placeholder="' + (column.filterLabel || 'Filter by ' + column.title) + '">\n\t\t\t\t\t\t';
					}

					if (columnFilter === DataTableView.columnFilters['dateBetween']) {
						column.postRender = function () {
							var postRender = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : function () {};

							return function (column, configuration, view) {
								postRender.call(undefined, column, configuration, view);
								$('#' + column.data + '_header_' + view.cid + ', #' + column.data + '_footer_' + view.cid, view.$el).each(function (index, element) {
									var $element = $(element);

									$element.daterangepicker({
										autoUpdateInput: false,
										locale: {
											cancelLabel: 'Clear'
										}
									});

									$element.on('apply.daterangepicker', function (ev, picker) {
										$(this).val(picker.startDate.format('YYYY/MM/DD') + ' to ' + picker.endDate.format('YYYY/MM/DD')).change();
									});

									$element.on('cancel.daterangepicker', function () {
										$(this).val('');
									});
								});
							};
						}(column.postRender);
					} else if (columnFilter === DataTableView.columnFilters['dateEquals']) {
						// TODO
						// column.postRender = ((postRender = (() => {})) => {
						// 	return (column, configuration, view) => {
						// 		postRender.call(this, column, configuration, view);
						// 		$(`#${column.data}_header_${view.cid}, #${column.data}_footer_${view.cid}`, view.$el).each((index, element) => {
						// 			$(element).datetimepicker({
						// 				format: 'YYYY/MM/DD'
						// 			});
						// 		});
						// 	}
						// })(column.postRender);
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
						// const index = $input.closest('tr').children('td, th').index($input.closest('td, th'));
						var index = +$input.closest('td, th').data('index');
						synceValue(value);
						columnFilter(configuration.serverSide, value, view.dataTable.column(index));
					};
					column.events['change #' + column.data + '_header_' + view.cid] = changeHandler;
					column.events['change #' + column.data + '_footer_' + view.cid] = changeHandler;

					var keyupHandler = function keyupHandler(event) {
						var $input = $(event.target);
						var value = $input.val();
						// const index = $input.closest('tr').children('td, th').index($input.closest('td, th'));
						var index = +$input.closest('td, th').data('index');
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