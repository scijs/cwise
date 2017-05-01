const gulp = require('gulp');

gulp.task('clean', function () {
	const del = require('del');
	return del('./dist/');
});

gulp.task('watch', () => {
	const ts = require('gulp-typescript');
	const path = require('path');
	return gulp.watch(['./src/**/*.ts'], (file) => {
		const tsProject = ts.createProject('./tsconfig.json');
		const relative = path.relative('./src/', path.dirname(file.path));
		const dest = tsProject.options.outDir;
		return gulp.src([file.path])
			.pipe(tsProject())
			.pipe(gulp.dest(dest));
	});
});

gulp.task('compile-ts', (cb) => {
	const ts = require('gulp-typescript');
	const tsProject = ts.createProject('./tsconfig.json');
	const dest = tsProject.options.outDir;
	return tsProject.src()
		.pipe(tsProject())
		.pipe(gulp.dest(dest));
});

gulp.task('copy-files', () => {
	return gulp.src(['./package.json', 'README.md', 'LICENSE'])
		.pipe(gulp.dest('./dist/'));
});

gulp.task('default', (cb) => {
	const sequence = require('gulp-sequence');
	sequence('clean', 'compile-ts', 'copy-files', cb);
});
