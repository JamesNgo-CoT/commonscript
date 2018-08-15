/* global cot_form CotForm getGlobal */

cot_form.prototype.validatorOptions = ((validatorOptions) => {
  return function (fieldDefinition) {
    const retVal = validatorOptions.call(this, fieldDefinition);
    if (fieldDefinition.excluded != null) {
      retVal.excluded = fieldDefinition.excluded;
    }
    return retVal;
  }
})(cot_form.prototype.validatorOptions);

cot_form.prototype.addformfield = ((addformfield) => {
	return function(fieldDefinition, fieldContainer) {
		addformfield.call(this, fieldDefinition, fieldContainer);
		if (fieldDefinition['readOnly'] === true) {
			$(':input', $(fieldContainer)).prop('readonly', true);
		}
	}
})(cot_form.prototype.addformfield);

/* exported ExtendedCotForm */
class ExtendedCotForm extends CotForm {

  // METHOD DEFINITION

  render(options = {}) {
    const definition = this._definition;

    const preRenderPromises = [];
    for (let sectionsIndex = 0, sectionsLength = definition.sections.length; sectionsIndex < sectionsLength; sectionsIndex++) {
      const section = definition.sections[sectionsIndex];
      if (section.preRender) {
        if (typeof section.preRender === 'string') {
          if (section.preRender.indexOf('function(') === 0) {
            section.preRender = Function(`return ${section.preRender}`)();
          } else {
            section.preRender = getGlobal(section.preRender);
          }
        }
        preRenderPromises.push(section.preRender(section, definition, this._model, options.view));
      }

      for (let rowsIndex = 0, rowsLength = section.rows.length; rowsIndex < rowsLength; rowsIndex++) {
        const row = section.rows[rowsIndex];
        if (row.preRender) {
          if (typeof row.preRender === 'string') {
            if (row.preRender.indexOf('function(') === 0) {
              row.preRender = Function(`return ${row.preRender}`)();
            } else {
              row.preRender = getGlobal(row.preRender);
            }
          }
          preRenderPromises.push(row.preRender(row, section, definition, this._model, options.view));
        }

        for (let fieldsIndex = 0, fieldsLength = row.fields.length; fieldsIndex < fieldsLength; fieldsIndex++) {
          const field = row.fields[fieldsIndex];

          if (field.choices && field.bindTo && field.type != 'checkbox') {
            const value = this._model.get(field.bindTo);
            if (value) {
              const choices = field.choices.map((value) => value.value || value.text);
              if (choices.indexOf(value) === -1) {
                field.choices.unshift({ text: value })
              }
            }
          }

          if (field.preRender) {
            if (typeof field.preRender === 'string') {
              if (field.preRender.indexOf('function(') === 0) {
                field.preRender = Function(`return ${field.preRender}`)();
              } else {
                field.preRender = getGlobal(field.preRender);
              }
            }
            preRenderPromises.push(field.preRender(field, row, section, definition, this._model, options.view));
          }
        }
      }
    }

    return Promise.all(preRenderPromises).then(() => {
      super.render.call(this, options);

      const postRenderPromises = [];
      for (let sectionsIndex = 0, sectionsLength = definition.sections.length; sectionsIndex < sectionsLength; sectionsIndex++) {
        const section = definition.sections[sectionsIndex];
        if (section.postRender) {
          if (typeof section.postRender === 'string') {
            if (section.postRender.indexOf('function(') === 0) {
              section.postRender = Function(`return ${section.postRender}`)();
            } else {
              section.postRender = getGlobal(section.postRender);
            }
          }
          postRenderPromises.push(section.postRender(section, definition, this._model, options.view));
        }

        for (let rowsIndex = 0, rowsLength = section.rows.length; rowsIndex < rowsLength; rowsIndex++) {
          const row = section.rows[rowsIndex];
          if (row.postRender) {
            if (typeof row.postRender === 'string') {
              if (row.postRender.indexOf('function(') === 0) {
                row.postRender = Function(`return ${row.postRender}`)();
              } else {
                row.postRender = getGlobal(row.postRender);
              }
            }
            postRenderPromises.push(row.postRender(row, section, definition, this._model, options.view));
          }

          for (let fieldsIndex = 0, fieldsLength = row.fields.length; fieldsIndex < fieldsLength; fieldsIndex++) {
            const field = row.fields[fieldsIndex];
            if (field.postRender) {
              if (typeof field.postRender === 'string') {
                if (field.postRender.indexOf('function(') === 0) {
                  field.postRender = Function(`return ${field.postRender}`)();
                } else {
                  field.postRender = getGlobal(field.postRender);
                }
              }
              postRenderPromises.push(field.postRender(field, row, section, definition, this._model, options.view));
            }
          }
        }
      }

      return Promise.all(postRenderPromises);
    });
  }
}
