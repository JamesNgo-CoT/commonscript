/* global moment */

/* exported DataTableView */
const DataTableView = Backbone.View.extend({

	// PROPERTY DEFINITION

	className: 'DataTableView',

	configuration: {
		columns: () => [DataTableView.columns.id]
	},

	dataTable: null,

	template: _.template(`{{> datatable_view.template.html }}`),

	// METHOD DEFINITION

	resetFilters: function () {
		$('tfoot input[type="text"], thead input[type="text"]', this.$el).each((index, element) => {
			$(element).val($(element).attr('value') || '').change();
		});
		$('tfoot select, thead select', this.$el).each((index, element) => {
			const $option = $(element).find('[selected]');
			const value = $option.attr('value')
			$(element).val(value != null ? value : $option.text()).change();
		});
		this.dataTable.search('').draw();
	},

	reload: function (callback, resetPaging = false) {
		if (this.dataTable) {
			this.dataTable.ajax.reload(callback, resetPaging);
		}
	},

	remove: function () {
		this.removeDataTable();
		Backbone.View.prototype.remove.call(this);
	},

	removeDataTable: function () {
		if (this.dataTable) {
			this.dataTable.destroy();
		}
	},

	render: function () {
		const configuration = _.result(this, 'configuration');
		const columns = configuration.columns = _.result(configuration, 'columns');
		const serverSide = configuration.serverSide = _.result(configuration, 'serverSide');

		return Promise.resolve(this.removeDataTable()).then(() => {

			// PRE-RENDER
			const preRenderPromises = [];
			for (let index = 0, length = columns.length; index < length; index++) {
				const column = columns[index];
				if (column['preRender']) {
					preRenderPromises.push(column['preRender'](column, configuration, this));
				}
			}

			return Promise.all(preRenderPromises);
		}).then(() => {

			// RENDER TEMPLATE
			this.$el.html(this.template({ configuration: configuration, view: this }));
		}).then(() => {

			// RENDER DATATABLE
			const dt_configuration = $.extend({
				orderCellsTop: true
			}, configuration);

			if (serverSide === true) {
				$.extend(dt_configuration, {
					ajax: (data, callback) => {

						// TODO.
						// const defaultFetchParameters = _.result(this.collection, 'fetchParameters');

						const fetchParameters = {};

						// $count
						fetchParameters['$count'] = true;

						// $filter
						const $filter = data.columns
							.filter((value) => value.searchable && value.search && value.search.value)
							.map((value) => value.search.value)
							.join(' and ');
						if ($filter) {
							fetchParameters['$filter'] = $filter;
						}

						// $orderby
						const $orderby = data.order
							.map((value) => {
								let orderBy = data.columns[value.column].data;

								const configOrderBy = _.result(configuration.columns[value.column], 'orderBy');
								const configDataType = _.result(configuration.columns[value.column], 'dataType');

								if (configOrderBy) {
									orderBy = configOrderBy;
								} else if (configDataType) {
									if (configDataType === 'string') {
										orderBy = `tolower(${orderBy})`;
									}
								}

								return `${orderBy} ${value.dir}`;
							})
							.join(',');
						if ($orderby) {
							fetchParameters['$orderby'] = $orderby;
						}

						// $search
						if (data.search && data.search.value) {
							fetchParameters['$search'] = `"${data.search.value}"`;
						}

						// $select
						// NOTE: $select is problematic. C3API does not like undefined columns.

						// $skip
						fetchParameters['$skip'] = data.start;

						// $top
						fetchParameters['$top'] = data.length;

						const complete = () => {
							callback({
								data: this.collection.toJSON({ transform: false }),
								draw: data.draw,
								recordsTotal: this.collection.totalRecords || 0,
								recordsFiltered: this.collection.totalRecords || 0
							});
						};

						this.collection.fetch({
							fetchParameters: fetchParameters
						}).then(complete, complete);
					}
				});
			} else {
				$.extend(dt_configuration, {
					data: this.collection.toJSON()
				});
			}

			this.dataTable = this.$el.find('table').DataTable(dt_configuration);
		}).then(() => {

			// Post Render and Event.
			const postRenderPromises = [];
			for (let index = 0, length = columns.length; index < length; index++) {

				const column = columns[index];
				if (column['postRender']) {
					postRenderPromises.push(column['postRender'](column, this.configuration, this));
				}

				if (column['events'] != null) {
					if (this.events == null) {
						this.events = {};
					}

					const events = _.result($.extend({ view: this }, column), 'events');
					for (const key in events) {
						this.events[key] = events[key];
					}
				}
			}

			this.delegateEvents();

			return Promise.all(postRenderPromises);
		}).then(() => {
			$('thead input, thead select, tfoot input, tfoot select', this.$el).change();
		}).catch((error) => {
			if (error) {
				alert(`An error occured. ${error}`);
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

			dom: `<'row'<'col-sm-6'l><'col-sm-6'f>><'row'<'col-sm-12'<'table-responsive'tr>>><'row'<'col-sm-5'i><'col-sm-7'p>>B`
		}
	},

	//////////////////////////////////////////////////////////////////////////////
	// COLUMN FILTERS
	//////////////////////////////////////////////////////////////////////////////

	columnFilters: {
		'booleanEquals': (serverSide, value, dtColumn) => {
			let search = '';

			if (value) {
				if (serverSide) {
					if (value === '$EMPTY') {
						search = `${dtColumn.dataSrc()} eq null`;
					} else if (value === '$NOTEMPTY') {
						search = `${dtColumn.dataSrc()} ne null`;
					} else if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
						search = `${dtColumn.dataSrc()} eq ${value.toLowerCase()}`;
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

		'numberEquals': (serverSide, value, dtColumn) => {
			let search = '';

			if (value) {
				if (serverSide) {
					if (value === '$EMPTY') {
						search = `${dtColumn.dataSrc()} eq null`;
					} else if (value === '$NOTEMPTY') {
						search = `${dtColumn.dataSrc()} ne null`;
					} else if (!isNaN(value)) {
						search = `${dtColumn.dataSrc()} eq ${value.toLowerCase()}`;
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

		'numberBetween': (serverSide, value, dtColumn) => {
			let search = '';

			if (value) {
				if (serverSide) {
					if (value === '$EMPTY') {
						search = `${dtColumn.dataSrc()} eq null`;
					} else if (value === '$NOTEMPTY') {
						search = `${dtColumn.dataSrc()} ne null`;
					} else if (value.toLowerCase().indexOf('to') !== -1) {
						const nums = value.toLowerCase().split('to');
						if (!isNaN(nums[0]) || !isNaN(nums[0])) {
							const searches = [];
							if (!isNaN(nums[0])) {
								searches[0] = `${dtColumn.dataSrc()} ge ${nums[0]}`;
							} else {
								searches[0] = null
							}
							if (!isNaN(nums[1])) {
								searches[1] = `${dtColumn.dataSrc()} le ${nums[1]}`;
							} else {
								searches[1] = null
							}
							search = searches.filter((val) => val).join(' and ');
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

		'stringEquals': (serverSide, value, dtColumn) => {
			let search = '';

			if (value) {
				if (serverSide) {
					if (value === '$EMPTY') {
						search = `${dtColumn.dataSrc()} eq null`;
					} else if (value === '$NOTEMPTY') {
						search = `${dtColumn.dataSrc()} ne null`;
					} else {
						// search = `tolower(${dtColumn.dataSrc()}) eq '${value.toLowerCase().replace('\'', '\\\'')}'`;
						search = `${dtColumn.dataSrc()} eq '${value.replace('\'', '\'\'')}'`;
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

		'stringContains': (serverSide, value, dtColumn) => {
			let search = '';

			if (value) {
				if (serverSide) {
					if (value === '$EMPTY') {
						search = `${dtColumn.dataSrc()} eq null`;
					} else if (value === '$NOTEMPTY') {
						search = `${dtColumn.dataSrc()} ne null`;
					} else {
						const words = value.toLowerCase().split(' ');
						const searches = [];
						for (let i = 0, l = words.length; i < l; i++) {
							searches.push(`contains(tolower(${dtColumn.dataSrc()}),'${words[i].replace('\'', '\'\'')}')`);
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

		'dateEquals': (serverSide, value, dtColumn) => {
			let search = '';

			if (value) {
				if (serverSide) {
					if (value === '$EMPTY') {
						search = `${dtColumn.dataSrc()} eq null`;
					} else if (value === '$NOTEMPTY') {
						search = `${dtColumn.dataSrc()} ne null`;
					} else if (moment(value, 'l').isValid()) {
						const start = moment(value, 'l').set({
							hour: 0,
							minute: 0,
							second: 0,
							millisecond: 0
						}).format();
						const end = moment(start).add({
							hours: 24
						}).format();
						search = `${dtColumn.dataSrc()} ge ${start} and ${dtColumn.dataSrc()} le ${end}`;
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

		'dateBetween': (serverSide, value, dtColumn) => {
			let search = '';

			if (value) {
				if (serverSide) {
					if (value === '$EMPTY') {
						search = `${dtColumn.dataSrc()} eq null`;
					} else if (value === '$NOTEMPTY') {
						search = `${dtColumn.dataSrc()} ne null`;
					} else if (value.toLowerCase().indexOf('to') !== -1) {
						const dates = value.toLowerCase().split('to');
						if (moment(dates[0]).isValid() || moment(dates[1]).isValid()) {
							const searches = [];
							if (moment(dates[0]).isValid()) {
								const start = moment(dates[0]).set({
									hour: 0,
									minute: 0,
									second: 0,
									millisecond: 0
								}).format();
								searches[0] = `${dtColumn.dataSrc()} ge ${start}`;
							} else {
								searches[0] = null
							}
							if (moment(dates[1]).isValid()) {
								const end = moment(dates[1]).set({
									hour: 0,
									minute: 0,
									second: 0,
									millisecond: 0
								}).add({
									hours: 24
								}).format();
								searches[1] = `${dtColumn.dataSrc()} le ${end}`;
							} else {
								searches[1] = null
							}
							search = searches.filter((val) => val).join(' and ');
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
		'filterHtmlFactory': (columnFilter, defaultValue) => {
			if (typeof columnFilter === 'string') {
				columnFilter = DataTableView.columnFilters[columnFilter];
			}
			return (column, configuration, view) => {
				return Promise.resolve().then(() => {
					if (column.choices && typeof column.choices === 'string') {
						return new Promise((resolve) => {
							const url = column.choices;
							column.choices = [];
							$.getJSON(url).then((data) => {
								if (Array.isArray(data)) {
									column.choices = data;
								}
								resolve();
							}, () => {
								resolve();
							});
						});
					}
				}).then(() => {
					if (column.choices) {
						if (column.choices.length === 0 || (column.choices[0].value != null && column.choices[0].value !== '') || (column.choices[0].value == null && column.choices[0].text !== '')) {
							column.choices.unshift({ text: '' });
						}
						column.headerHtml = `
							<label class="sr-only" for="${column.data}_header_${view.cid}">Filter ${column.title || column.data}</label>
							<select class="form-control" id="${column.data}_header_${view.cid}">
								${column.choices.map((choice) => '<option value="' + (choice.value != null ? choice.value : choice.text) + '"' + ((choice.value != null && choice.value === defaultValue) || (choice.value == null && choice.text === defaultValue) ? ' selected' : '') + '>' + choice.text + '</option>').join('')}
							</select>
						`;
						column.footerHtml = `
							<label class="sr-only" for="${column.data}_footer_${view.cid}">Filter ${column.title || column.data}</label>
							<select class="form-control" id="${column.data}_footer_${view.cid}">
								${column.choices.map((choice) => '<option value="' + (choice.value != null ? choice.value : choice.text) + '"' + ((choice.value != null && choice.value === defaultValue) || (choice.value == null && choice.text === defaultValue) ? ' selected' : '') + '>' + choice.text + '</option>').join('')}
							</select>
						`;
					} else {
						column.headerHtml = `
							<label class="sr-only" for="${column.data}_header_${view.cid}">Filter ${column.title || column.data}</label>
							<input type="text" class="form-control" id="${column.data}_header_${view.cid}"${defaultValue ? ' value="' + defaultValue + '"' : ''}>
						`;
						column.footerHtml = `
							<label class="sr-only" for="${column.data}_footer_${view.cid}">Filter ${column.title || column.data}</label>
							<input type="text" class="form-control" id="${column.data}_footer_${view.cid}"${defaultValue ? ' value="' + defaultValue + '"' : ''}>
						`;
					}

					if (columnFilter === DataTableView.columnFilters['dateBetween']) {
						column.postRender = ((postRender = (() => { })) => {
							return (column, configuration, view) => {
								postRender.call(this, column, configuration, view);
								$(`#${column.data}_header_${view.cid}, #${column.data}_footer_${view.cid}`, view.$el).each((index, element) => {
									const $element = $(element);

									$element.daterangepicker({
										autoUpdateInput: false,
										locale: {
											cancelLabel: 'Clear'
										}
									});

									$element.on('apply.daterangepicker', function (ev, picker) {
										$(this).val(picker.startDate.format('YYYY/MM/DD/') + ' to ' + picker.endDate.format('YYYY/MM/DD')).change();
									});

									$element.on('cancel.daterangepicker', function () {
										$(this).val('');
									});
								});

							}
						})(column.postRender);
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

					const synceValue = (value) => {
						const $headerInput = $(`#${column.data}_header_${view.cid}`);
						if ($headerInput.val() !== value) {
							$headerInput.val(value);
						}
						const $footerInput = $(`#${column.data}_footer_${view.cid}`);
						if ($footerInput.val() !== value) {
							$footerInput.val(value);
						}
					};

					const changeHandler = (event) => {
						const $input = $(event.target);
						const value = $input.val();
						const index = $input.closest('tr').children('td, th').index($input.closest('td, th'));
						synceValue(value);
						columnFilter(configuration.serverSide, value, view.dataTable.column(index));
					};
					column.events[`change #${column.data}_header_${view.cid}`] = changeHandler;
					column.events[`change #${column.data}_footer_${view.cid}`] = changeHandler;

					const keyupHandler = (event) => {
						const $input = $(event.target);
						const value = $input.val();
						const index = $input.closest('tr').children('td, th').index($input.closest('td, th'));
						synceValue(value);
						columnFilter(configuration.serverSide, value, view.dataTable.column(index));
					};
					column.events[`keyup #${column.data}_header_${view.cid}`] = keyupHandler;
					column.events[`keyup #${column.data}_footer_${view.cid}`] = keyupHandler;
				});
			}
		}
	}
});
