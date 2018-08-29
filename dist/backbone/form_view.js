'use strict';

/* global ExtendedCotForm */

/* exported FormView */
var FormView = Backbone.View.extend({

	// MARK: PROPERTY DEFINITION

	className: 'FormView',

	rootPath: '/* @echo SRC_PATH *//',

	template: _.template('\n    <div class="formWrapper"></div>\n  '),

	template_buttons: _.template('\n    <div class="hidden-print btns-bar row">\n      <div class="col-xs-12">\n        <button type="submit" class="btn btn-primary btn-lg btn-submit">Submit</button>\n      </div>\n    </div>\n  '),

	// MARK: METHOD DEFINITION

	render: function render() {
		var _this = this;

		var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

		this.$el.html(this.template({
			model: this.model
		}));

		var formDefinition = $.extend({}, this.definition, {
			id: this.definition['id'] || 'form_' + this.model.cid,

			rootPath: _.result(this, 'rootPath'),

			success: this.definition['success'] || options.success || function (event) {
				event.preventDefault();

				Promise.resolve().then(function () {
					// TODO - DECIDE IF CALLBACK OR EVENT
					if (options.beforeSave != null) {
						return options.beforeSave.call(_this);
					}
				}).then(function () {
					return _this.model.save();
				}).then(function () {
					// TODO - DECIDE IF CALLBACK OR EVENT
					if (options.afterSave != null) {
						options.afterSave.call(_this);
					} else {
						alert('Saved!');
					}
				}).catch(function (error) {
					if (error && window.console && console.error) {
						console.error('An error occurred.', error);
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

					if (field.choices) {
						if (typeof field.choices === 'string') {
							var choicesPromise = new Promise(function (resolve) {
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
							});
							choicesPromises.push(choicesPromise);
						}
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
				$form.append(_this.template_buttons({ model: _this.model }));

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
			if (error && window.console && console.error) {
				console.error('An error occured.', error);
			}
		});
	}
});