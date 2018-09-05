'use strict';

/* global ExtendedCotForm */

/* exported FormView */
var FormView = Backbone.View.extend({

	// MARK: PROPERTY DEFINITION

	className: 'FormView',

	definition: null,

	rootPath: '/* @echo SRC_PATH *//',

	template: function template() {
		return '<div class="formWrapper"></div>';
	},

	template_buttons: function template_buttons() {
		return '\n\t\t<div class="hidden-print btns-bar row">\n\t\t\t<div class="col-xs-12">\n\t\t\t\t<button type="submit" class="btn btn-primary btn-lg btn-submit">Submit</button>\n\t\t\t</div>\n\t\t</div>\n\t';
	},

	// MARK: METHOD DEFINITION

	render: function render() {
		var _this = this;

		var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

		this.$el.html(this.template({
			model: this.model
		}));

		var definition = _.result(this, 'definition');
		var formDefinition = $.extend({}, definition, {
			id: definition['id'] || 'form_' + this.model.cid,

			rootPath: _.result(this, 'rootPath'),

			success: definition['success'] || options.success || function (event) {
				event.preventDefault();

				Promise.resolve().then(function () {
					if (options.beforeSave != null) {
						return options.beforeSave();
					}
				}).then(function () {
					return new Promise(function (resolve, reject) {
						_this.model.save(null, { $originatingElement: $(options.originatingElementSelector || '.btn-submit', _this.$el) }).then(function (data, textStatus, jqXHR) {
							_this.trigger('saved', data, textStatus, jqXHR);
							resolve(data);
						}, function (jqXHR, textStatus, errorThrown) {
							_this.trigger('savefailed', jqXHR, textStatus, errorThrown);
							reject(errorThrown);
						});
					});
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

				return false;
			},

			useBinding: true
		});

		var choicesPromises = [];
		for (var sectionsIndex = 0, sectionsLength = formDefinition.sections.length; sectionsIndex < sectionsLength; sectionsIndex++) {
			var section = formDefinition.sections[sectionsIndex];

			for (var rowsIndex = 0, rowsLength = section.rows.length; rowsIndex < rowsLength; rowsIndex++) {
				var row = section.rows[rowsIndex];

				var _loop = function _loop(fieldsIndex, fieldsLength) {
					var field = row.fields[fieldsIndex];

					if (field.choices && typeof field.choices === 'string') {
						choicesPromises.push(new Promise(function (resolve) {
							var url = field.choices;
							field.choices = [];
							$.getJSON(url).then(function (data) {
								if (Array.isArray(data)) {
									field.choices = data;
								}
								resolve();
							}, function () {
								resolve();
							});
						}));
					}
				};

				for (var fieldsIndex = 0, fieldsLength = row.fields.length; fieldsIndex < fieldsLength; fieldsIndex++) {
					_loop(fieldsIndex, fieldsLength);
				}
			}
		}

		return Promise.all(choicesPromises).then(function () {
			var form = new ExtendedCotForm(formDefinition);
			form.setModel(_this.model);

			return form.render({
				target: $('.formWrapper', _this.$el),
				view: _this
			}).then(function () {
				var $form = $('.formWrapper form', _this.$el);
				$form.append(_this.template_buttons({
					model: _this.model
				}));
			}).then(function () {
				var $linkButton = $('a.btn', _this.$el).not('[role="button"]');
				$linkButton.attr('role', 'button');
				$linkButton.on('keydown', function (event) {
					if (event.which === 32) {
						event.preventDefault();
						event.target.click();
					}
				});
			});
		}).catch(function (error) {
			/* eslint-disable no-console */
			if (error && window.console && console.error) {
				console.error('An error occured.', error);
			}
			/* eslint-enable no-console */
		});
	}
});