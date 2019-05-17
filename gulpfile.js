var gulp = require('gulp');
var ts = require('gulp-typescript');
var tslint = require('gulp-tslint');
var del = require('del');
var server = require('gulp-develop-server');
var mocha = require('gulp-spawn-mocha');
var sourcemaps = require('gulp-sourcemaps');
var zip = require('gulp-zip');
var rename = require('gulp-rename');
var jsonTransform = require('gulp-json-transform');
var path = require('path');
var minimist = require('minimist');
var fs = require('fs');
var _ = require('lodash');

var knownOptions = {
	string: 'packageName',
	string: 'packagePath',
	string: 'specFilter',
	default: {packageName: 'Package.zip', packagePath: path.join(__dirname, '_package'), specFilter: '*'}
};
var options = minimist(process.argv.slice(2), knownOptions);

var tsProject = ts.createProject('./tsconfig.json', {
    // Point to the specific typescript package we pull in, not a machine-installed one
    typescript: require('typescript'),
});

var filesToWatch = ['**/*.ts', '!node_modules/**'];
var filesToLint = ['**/*.ts', '!src/typings/**', '!node_modules/**'];
var staticFiles = ['src/**/*.json', 'src/**/*.hbs'];

/**
 * Clean build output.
 */
gulp.task('clean', function (done) {
    del([
        'build/**/*',
        // Azure doesn't like it when we delete build/src
        '!build/src'
    ]);
    done();
});

/**
 * Lint all TypeScript files.
 */
gulp.task('ts:lint', function (done) {
    if (!process.env.GLITCH_NO_LINT) {
        gulp
            .src(filesToLint)
            .pipe(tslint({
                formatter: 'verbose'
            }))
            .pipe(tslint.report({
                summarizeFailureOutput: true
            }));
      }
    done();
});

/**
 * Compile TypeScript and include references to library.
 */
gulp.task('ts', gulp.series('clean', function(done) {
    tsProject
        .src()
        .pipe(sourcemaps.init())
        .pipe(tsProject())
        .pipe(sourcemaps.write('.', {includeContent: false, sourceRoot: '.'}))
        .pipe(gulp.dest('build'));
    done();
}));

/**
 * Copy statics to build directory.
 */
gulp.task('statics:copy', gulp.series('clean', function (done) {
    gulp.src(staticFiles, { base: '.' })
        .pipe(gulp.dest('./build'));
    done();
}));

/**
 * Build application.
 */
gulp.task('build', gulp.series('clean', 'ts:lint', 'ts', 'statics:copy'));

/**
 * Build manifest
 */
gulp.task('generate-manifest', function(done) {
    gulp.src(['./manifest/*.png', 'manifest/manifest.json'])
        .pipe(zip('AuthBot.zip'))
        .pipe(gulp.dest('manifest'));
    done();
});

/**
 * Run tests.
 */
gulp.task('test', gulp.series('ts', 'statics:copy', function(done) {
    gulp
        .src('build/test/' + options.specFilter + '.spec.js', {read: false})
        .pipe(mocha({cwd: 'build/src'}))
        .once('error', function () {
            process.exit(1);
        })
        .once('end', function () {
            process.exit();
        });
    done();
}));

/**
 * Package up app into a ZIP file for Azure deployment.
 */
gulp.task('package', gulp.series('build', function (done) {
    var packagePaths = [
        'build/**/*',
        'public/**/*',
        'web.config',
        'package.json',
        '**/node_modules/**',
        '!build/src/**/*.js.map', 
        '!build/test/**/*', 
        '!build/test', 
        '!build/src/typings/**/*'];

    //add exclusion patterns for all dev dependencies
    var packageJSON = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
    var devDeps = packageJSON.devDependencies;
    for (var propName in devDeps) {
        var excludePattern1 = '!**/node_modules/' + propName + '/**';
        var excludePattern2 = '!**/node_modules/' + propName;
        packagePaths.push(excludePattern1);
        packagePaths.push(excludePattern2);
    }

    gulp.src(packagePaths, { base: '.' })
        .pipe(zip(options.packageName))
        .pipe(gulp.dest(options.packagePath));
    done();
}));

gulp.task('server:start', gulp.series('build', function(done) {
    server.listen({path: 'app.js', cwd: 'build/src'}, function(error) {
        console.error(error);
    });
    done();
}));

gulp.task('server:restart', gulp.series('build', function(done) {
    server.restart();
    done();
}));

gulp.task('default', gulp.series('server:start', function(done) {
    gulp.watch(filesToWatch, ['server:restart']);
    done();
}));
