var gulp = require('gulp');
var ts = require('gulp-typescript');

// var BUILD_DIR = 'build';
// var PUBLIC_DIR = 'build/public';

gulp.task('app-typescript', function() {
	return gulp.src(['App.ts', 'Roomdata.ts', 'Nav.ts'])
    .on('change', function(file) { console.log(file + " changed."); })
    .pipe(ts({
        outFile: "Amnesia.js",
        removeComments: true,
        strictNullChecks: true,
        target: "ES6"
    }))
    .on('error', function(error) { console.log(error); })
	.pipe(gulp.dest('.'));
});
gulp.task('watch-app-ts', function() {
    gulp.watch(['App.ts', 'Roomdata.ts', 'Nav.ts'], ['app-typescript']);
});

gulp.task('default', ['app-typescript', 'watch-app-ts']);