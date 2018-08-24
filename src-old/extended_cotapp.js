/* global cot_app */

////////////////////////////////////////////////////////////////////////////////

class AbstractExtendedCot_App {
	constructor(name, options = {}) {
		this.name = name;

		$.extend(this, {
			hasHeader: true,
			hasFooter: true,
			hasContentTop: true,
			hasContentBottom: true,
			hasContentRight: true,
			hasContentLeft: true,
			hasLeftNav: false,
			searchcontext: 'INTER'
		}, options || {});

		this.breadcrumbItems = [];
		this.isRendered = false;
	}
}
AbstractExtendedCot_App.prototype = cot_app.prototype;

////////////////////////////////////////////////////////////////////////////////

/* exported ExtendedCotApp */
class ExtendedCotApp extends AbstractExtendedCot_App {

	// METHOD DEFINITION

	setTitle(title) {
		if (title && title !== this.name) {
			document.title = `${title} - ${this.name}`;
		} else {
			document.title = this.name;
		}

		return super.setTitle(title);
	}

	static singleton() {
		if (!ExtendedCotApp._singleton) {
			ExtendedCotApp._singleton = new ExtendedCotApp();
		}

		return ExtendedCotApp._singleton;
	}
}
