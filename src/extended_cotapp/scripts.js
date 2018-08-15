/* global cot_app */

/* exported ExtendedCotApp */
class ExtendedCotApp extends cot_app {

	// METHOD DEFINITION

	setTitle(title) {
		super.setTitle(title);

		if (title && title !== this.name) {
			document.title = `${title} - ${this.name}`;
		} else {
			document.title = this.name;
		}
	}
}
