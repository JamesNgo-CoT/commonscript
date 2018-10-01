/* global cot_app */

/* exported ExtendedCotApp */
/**
 * Extends the original cot_app class.
 */
class ExtendedCotApp extends cot_app {

	// METHOD DEFINITION

	/**
	 * Sets the document's title. Extended to include the document's metadata title.
	 * @param {string} title
	 */
	setTitle(title) {
		if (title && title !== this.name) {
			document.title = `${title} - ${this.name}`;
		} else {
			document.title = this.name;
		}

		return super.setTitle(title);
	}
}
