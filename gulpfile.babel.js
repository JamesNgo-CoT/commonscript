import autoPrefixer from 'gulp-autoprefixer';
import babel from 'gulp-babel';
import cssNano from 'gulp-cssnano';
import debug from 'gulp-debug';
import del from 'del';
import esLint from 'gulp-eslint';
import gulp from 'gulp';
import less from 'gulp-less';
import mergeStream from 'merge-stream';
import mustache from 'gulp-mustache';
import rename from 'gulp-rename';
import sass from 'gulp-sass';
import sourceMaps from 'gulp-sourcemaps';
import uglify from 'gulp-uglify';
import webDependencies from 'gulp-web-dependencies';
import webServer from 'gulp-webserver';

export function clean() {
	return del('./dist');
}

////////////////////////////////////////////////////////////////////////////////
// HTML
////////////////////////////////////////////////////////////////////////////////

const buildHtmlSrc = './src/**/!(*.template).html';
export function buildHtml() {
	const buildHtmlDest = './dist/';
	return gulp.src(buildHtmlSrc)
		.pipe(debug())
		.pipe(mustache())
		.pipe(webDependencies({ dest: buildHtmlDest, prefix: './vendors/' }))
		.pipe(gulp.dest(buildHtmlDest));
}

////////////////////////////////////////////////////////////////////////////////
// CSS
////////////////////////////////////////////////////////////////////////////////

const buildCssSrc = './src/**/!(*.template).css';
const buildLessSrc = './src/**/!(*.template).less';
const buildSassSrc = './src/**/!(*.template).scss';
export function buildCss() {
	const cssStream = gulp.src(buildCssSrc)
		.pipe(debug())
		.pipe(mustache());

	const lessStream = gulp.src(buildLessSrc)
		.pipe(debug())
		.pipe(mustache())
		.pipe(less());

	const scssStream = gulp.src(buildSassSrc)
		.pipe(debug())
		.pipe(mustache())
		.pipe(sass());

	const buildCssDest = './dist/';
	return mergeStream(cssStream, lessStream, scssStream)
		.pipe(autoPrefixer())
		.pipe(gulp.dest(buildCssDest))
		.pipe(rename((path) => path.basename += '.min'))
		.pipe(sourceMaps.init())
		.pipe(cssNano())
		.pipe(sourceMaps.write('.'))
		.pipe(gulp.dest(buildCssDest));
}

////////////////////////////////////////////////////////////////////////////////
// SCRIPT
////////////////////////////////////////////////////////////////////////////////

const buildJsSrc = './src/**/!(*.template).js';
export function buildJs() {
	const buildJsDest = './dist/';
	return gulp.src(buildJsSrc)
		.pipe(debug())
		.pipe(mustache())
		.pipe(esLint())
		.pipe(esLint.format())
		.pipe(babel())
		.pipe(gulp.dest(buildJsDest))
		.pipe(rename((path) => path.basename += '.min'))
		.pipe(sourceMaps.init())
		.pipe(uglify())
		.pipe(sourceMaps.write('.'))
		.pipe(gulp.dest(buildJsDest));
}

////////////////////////////////////////////////////////////////////////////////
// BUILD
////////////////////////////////////////////////////////////////////////////////

export const build = gulp.series(clean, gulp.parallel(buildJs, buildCss, buildHtml));

export function watch() {
	const servePath = '.';
	gulp.src(servePath)
		.pipe(webServer({
			directoryListing: { enable: true, path: servePath },
			livereload: true,
			open: true,
			port: 8080
		}));

	const htmlTemplate = './src/**/*.template.html';
	gulp.watch((Array.isArray(buildHtmlSrc) ? buildHtmlSrc : [buildHtmlSrc]).concat(
		Array.isArray(htmlTemplate) ? htmlTemplate : [htmlTemplate]
	), buildHtml);

	const cssTemplate = './src/**/*.template.css';
	const lessTemplate = './src/**/*.template.less';
	const scssTemplate = './src/**/*.template.scss';
	gulp.watch((Array.isArray(buildCssSrc) ? buildCssSrc : [buildCssSrc]).concat(
		Array.isArray(cssTemplate) ? cssTemplate : [cssTemplate],
		Array.isArray(buildLessSrc) ? buildLessSrc : [buildLessSrc],
		Array.isArray(lessTemplate) ? lessTemplate : [lessTemplate],
		Array.isArray(buildSassSrc) ? buildSassSrc : [buildSassSrc],
		Array.isArray(scssTemplate) ? scssTemplate : [scssTemplate]
	), buildCss);

	const jsTemplate = './src/**/*.template.js';
	gulp.watch((Array.isArray(buildJsSrc) ? buildJsSrc : [buildJsSrc]).concat(
		Array.isArray(jsTemplate) ? jsTemplate : [jsTemplate]
	), buildJs);
}

export const serve = gulp.series(build, watch);

export default build;
