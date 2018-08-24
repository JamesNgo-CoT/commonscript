'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/* global cot_form CotForm getGlobal */

////////////////////////////////////////////////////////////////////////////////

var ExtendedCot_Form = function (_cot_form) {
	_inherits(ExtendedCot_Form, _cot_form);

	function ExtendedCot_Form() {
		_classCallCheck(this, ExtendedCot_Form);

		return _possibleConstructorReturn(this, (ExtendedCot_Form.__proto__ || Object.getPrototypeOf(ExtendedCot_Form)).apply(this, arguments));
	}

	_createClass(ExtendedCot_Form, [{
		key: 'addformfield',


		/* METHOD DEFINITION */

		value: function addformfield(fieldDefinition, fieldContainer) {
			_get(ExtendedCot_Form.prototype.__proto__ || Object.getPrototypeOf(ExtendedCot_Form.prototype), 'addformfield', this).call(this, fieldDefinition, fieldContainer);
			if (fieldDefinition['readOnly'] === true) {
				$(':input', $(fieldContainer)).prop('readonly', true);
			}
		}
	}, {
		key: 'validatorOptions',
		value: function validatorOptions(fieldDefinition) {
			var retVal = _get(ExtendedCot_Form.prototype.__proto__ || Object.getPrototypeOf(ExtendedCot_Form.prototype), 'validatorOptions', this).call(this, fieldDefinition);
			if (fieldDefinition.excluded != null) {
				retVal.excluded = fieldDefinition.excluded;
			}
			return retVal;
		}
	}]);

	return ExtendedCot_Form;
}(cot_form);

////////////////////////////////////////////////////////////////////////////////

var AbstractExtendedCotForm = function AbstractExtendedCotForm() {
	_classCallCheck(this, AbstractExtendedCotForm);
};

AbstractExtendedCotForm.prototype = CotForm.prototype;

////////////////////////////////////////////////////////////////////////////////

/* exported ExtendedCotForm */

var ExtendedCotForm = function (_AbstractExtendedCotF) {
	_inherits(ExtendedCotForm, _AbstractExtendedCotF);

	/* CONSTRUCTOR DEFINITION */

	function ExtendedCotForm(definition) {
		_classCallCheck(this, ExtendedCotForm);

		var _this2 = _possibleConstructorReturn(this, (ExtendedCotForm.__proto__ || Object.getPrototypeOf(ExtendedCotForm)).call(this));

		if (!definition) {
			throw new Error('You must supply a form definition');
		}

		_this2._isRendered = false;
		_this2._definition = definition;
		_this2._useBinding = definition['useBinding'] || false;
		_this2._model = null;

		_this2.cotForm = new ExtendedCot_Form({
			'id': definition['id'] || 'new_form',
			'title': definition['title'],
			'rootPath': definition['rootPath'],
			'success': definition['success'] || function () {}
		});
		_this2.cotForm._cotForm = _this2;

		var bindableTypes = ['text', 'number', 'phone', 'email', 'hidden', 'dropdown', 'textarea', 'checkbox', 'radio', 'password', 'multiselect', 'datetimepicker', 'daterangepicker', 'dropzone'];

		(definition['sections'] || []).forEach(function (sectionInfo, index) {
			var section = _this2.cotForm.addSection({
				'id': sectionInfo['id'] || 'section' + index,
				'title': sectionInfo['title'],
				'className': sectionInfo['className'],
				'readSectionName': sectionInfo['readSectionName']
			});

			(sectionInfo['rows'] || []).forEach(function (row) {
				if (row['fields']) {
					row['fields'].forEach(function (field) {
						var type = field['type'] || 'text';
						if (field['bindTo'] && bindableTypes.indexOf(type) === -1) {
							throw new Error('Error in field ' + (field['id'] || 'no id') + ', fields of type ' + type + ' cannot use bindTo.');
						}
					});
					section.addRow(row['fields']);
				} else if (row['grid']) {
					section.addGrid(row['grid']);
				} else if (row['repeatControl']) {
					section.addRepeatControl(row['repeatControl']);
				}
			});
		});
		return _this2;
	}

	// METHOD DEFINITION

	_createClass(ExtendedCotForm, [{
		key: 'render',
		value: function render() {
			var _this3 = this;

			var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

			var definition = this._definition;

			var preRenderPromises = [];
			for (var sectionsIndex = 0, sectionsLength = definition.sections.length; sectionsIndex < sectionsLength; sectionsIndex++) {
				var section = definition.sections[sectionsIndex];
				if (section.preRender) {
					if (typeof section.preRender === 'string') {
						if (section.preRender.indexOf('function(') === 0) {
							section.preRender = Function('return ' + section.preRender)();
						} else {
							section.preRender = getGlobal(section.preRender);
						}
					}
					preRenderPromises.push(section.preRender(section, definition, this._model, options.view));
				}

				for (var rowsIndex = 0, rowsLength = section.rows.length; rowsIndex < rowsLength; rowsIndex++) {
					var row = section.rows[rowsIndex];
					if (row.preRender) {
						if (typeof row.preRender === 'string') {
							if (row.preRender.indexOf('function(') === 0) {
								row.preRender = Function('return ' + row.preRender)();
							} else {
								row.preRender = getGlobal(row.preRender);
							}
						}
						preRenderPromises.push(row.preRender(row, section, definition, this._model, options.view));
					}

					for (var fieldsIndex = 0, fieldsLength = row.fields.length; fieldsIndex < fieldsLength; fieldsIndex++) {
						var field = row.fields[fieldsIndex];

						if (field.choices && field.bindTo && field.type != 'checkbox') {
							var value = this._model.get(field.bindTo);
							if (value) {
								var choices = field.choices.map(function (value) {
									return value.value || value.text;
								});
								if (choices.indexOf(value) === -1) {
									field.choices.unshift({ text: value });
								}
							}
						}

						if (field.preRender) {
							if (typeof field.preRender === 'string') {
								if (field.preRender.indexOf('function(') === 0) {
									field.preRender = Function('return ' + field.preRender)();
								} else {
									field.preRender = getGlobal(field.preRender);
								}
							}
							preRenderPromises.push(field.preRender(field, row, section, definition, this._model, options.view));
						}
					}
				}
			}

			return Promise.all(preRenderPromises).then(function () {
				_get(ExtendedCotForm.prototype.__proto__ || Object.getPrototypeOf(ExtendedCotForm.prototype), 'render', _this3).call(_this3, options);

				var postRenderPromises = [];
				for (var _sectionsIndex = 0, _sectionsLength = definition.sections.length; _sectionsIndex < _sectionsLength; _sectionsIndex++) {
					var _section = definition.sections[_sectionsIndex];
					if (_section.postRender) {
						if (typeof _section.postRender === 'string') {
							if (_section.postRender.indexOf('function(') === 0) {
								_section.postRender = Function('return ' + _section.postRender)();
							} else {
								_section.postRender = getGlobal(_section.postRender);
							}
						}
						postRenderPromises.push(_section.postRender(_section, definition, _this3._model, options.view));
					}

					for (var _rowsIndex = 0, _rowsLength = _section.rows.length; _rowsIndex < _rowsLength; _rowsIndex++) {
						var _row = _section.rows[_rowsIndex];
						if (_row.postRender) {
							if (typeof _row.postRender === 'string') {
								if (_row.postRender.indexOf('function(') === 0) {
									_row.postRender = Function('return ' + _row.postRender)();
								} else {
									_row.postRender = getGlobal(_row.postRender);
								}
							}
							postRenderPromises.push(_row.postRender(_row, _section, definition, _this3._model, options.view));
						}

						for (var _fieldsIndex = 0, _fieldsLength = _row.fields.length; _fieldsIndex < _fieldsLength; _fieldsIndex++) {
							var _field = _row.fields[_fieldsIndex];
							if (_field.postRender) {
								if (typeof _field.postRender === 'string') {
									if (_field.postRender.indexOf('function(') === 0) {
										_field.postRender = Function('return ' + _field.postRender)();
									} else {
										_field.postRender = getGlobal(_field.postRender);
									}
								}
								postRenderPromises.push(_field.postRender(_field, _row, _section, definition, _this3._model, options.view));
							}
						}
					}
				}

				return Promise.all(postRenderPromises);
			});
		}
	}]);

	return ExtendedCotForm;
}(AbstractExtendedCotForm);