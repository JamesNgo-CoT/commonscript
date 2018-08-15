/* global ExtendedCotForm */

/* exported FormView */
const FormView = Backbone.View.extend({

	// MARK: PROPERTY DEFINITION

	className: 'FormView',

	rootPath: '/* @echo SRC_PATH *//',

	template: _.template(`
    <div class="formWrapper"></div>
  `),

	template_buttons: _.template(`
    <div class="hidden-print btns-bar row">
      <div class="col-xs-12">
        <button type="submit" class="btn btn-primary btn-lg btn-submit">Submit</button>
      </div>
    </div>
  `),

	// MARK: METHOD DEFINITION

	render: function (options = {}) {
		this.$el.html(this.template({
			model: this.model
		}));

		const formDefinition = $.extend({}, this.definition, {
			id: this.definition['id'] || 'form_' + this.model.cid,

			rootPath: _.result(this, 'rootPath'),

			success: this.definition['success'] || options.success || ((event) => {
				event.preventDefault();

				Promise.resolve().then(() => { // TODO - DECIDE IF CALLBACK OR EVENT
					if (options.beforeSave != null) {
						return options.beforeSave.call(this);
					}
				}).then(() => {
					return this.model.save();
				}).then(() => { // TODO - DECIDE IF CALLBACK OR EVENT
					if (options.afterSave != null) {
						options.afterSave.call(this);
					} else {
						alert('Saved!');
					}
				}).catch((error) => {
					if (error && window.console && console.error) {
						console.error('An error occurred.', error);
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

					if (field.choices) {
						if (typeof field.choices === 'string') {
							const choicesPromise = new Promise((resolve) => {
								const url = field.choices;
								field.choices = [];

								$.getJSON(url).then((data) => {
									if (Array.isArray(data)) {
										field.choices = data;
									}
									resolve()
								}, () => {
									resolve();
								});
							});
							choicesPromises.push(choicesPromise);
						}
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
				$form.append(this.template_buttons({ model: this.model }));

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
			if (error && window.console && console.error) {
				console.error('An error occured.', error);
			}
		});
	}
});
