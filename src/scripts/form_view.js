/* global ExtendedCotForm */

/* exported FormView */
const FormView = Backbone.View.extend({

	// MARK: PROPERTY DEFINITION

	className: 'FormView',

	definition: null,

	rootPath: '/* @echo SRC_PATH *//',

	template: () => '<div class="formWrapper"></div>',

	template_buttons: () => `
		<div class="hidden-print btns-bar row">
			<div class="col-xs-12">
				<button type="submit" class="btn btn-primary btn-lg btn-submit">Submit</button>
			</div>
		</div>
	`,

	// MARK: METHOD DEFINITION

	render: function (options = {}) {
		this.$el.html(this.template({
			model: this.model
		}));

		const definition = _.result(this, 'definition');
		const formDefinition = $.extend({}, definition, {
			id: definition['id'] || 'form_' + this.model.cid,

			rootPath: _.result(this, 'rootPath'),

			success: definition['success'] || options.success || ((event) => {
				event.preventDefault();

				Promise.resolve().then(() => {
					if (options.beforeSave != null) {
						return options.beforeSave();
					}
				}).then(() => {
					return new Promise((resolve, reject) => {
						this.model.save(null, { $originatingElement: $(options.originatingElementSelector || '.btn-submit', this.$el) }).then((data, textStatus, jqXHR) => {
							this.trigger('saved', data, textStatus, jqXHR);
							resolve(data);
						}, (jqXHR, textStatus, errorThrown) => {
							this.trigger('savefailed', jqXHR, textStatus, errorThrown);
							reject(errorThrown);
						});
					});
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

				return false;
			}),

			useBinding: true
		});

		const choicesPromises = [];
		for (let sectionsIndex = 0, sectionsLength = formDefinition.sections.length; sectionsIndex < sectionsLength; sectionsIndex++) {
			const section = formDefinition.sections[sectionsIndex];

			for (let rowsIndex = 0, rowsLength = section.rows.length; rowsIndex < rowsLength; rowsIndex++) {
				const row = section.rows[rowsIndex];

				for (let fieldsIndex = 0, fieldsLength = row.fields.length; fieldsIndex < fieldsLength; fieldsIndex++) {
					const field = row.fields[fieldsIndex];

					if (field.choices && typeof field.choices === 'string') {
						choicesPromises.push(new Promise((resolve) => {
							const url = field.choices;
							field.choices = [];
							$.getJSON(url).then((data) => {
								if (Array.isArray(data)) {
									field.choices = data;
								}
								resolve();
							}, () => {
								resolve();
							});
						}));
					}
				}
			}
		}

		return Promise.all(choicesPromises).then(() => {
			const form = new ExtendedCotForm(formDefinition);
			form.setModel(this.model);

			return form.render({
				target: $('.formWrapper', this.$el),
				view: this
			}).then(() => {
				const $form = $('.formWrapper form', this.$el);
				$form.append(this.template_buttons({
					model: this.model
				}));
			}).then(() => {
				const $linkButton = $('a.btn', this.$el).not('[role="button"]');
				$linkButton.attr('role', 'button');
				$linkButton.on('keydown', function (event) {
					if (event.which === 32) {
						event.preventDefault();
						event.target.click();
					}
				});
			});
		}).catch((error) => {
			/* eslint-disable no-console */
			if (error && window.console && console.error) {
				console.error('An error occured.', error);
			}
			/* eslint-enable no-console */
		});
	}
});
