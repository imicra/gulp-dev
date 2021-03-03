'use strict';

var themename = 'recurs';

var gulp = require('gulp'),
    plumber = require( 'gulp-plumber' ),
    rename = require( 'gulp-rename' ),
    autoprefixer = require('autoprefixer'),
    postcss = require('gulp-postcss'),
    sass = require('gulp-sass'),
    cleanCSS = require( 'gulp-clean-css' ),
    sourcemaps = require('gulp-sourcemaps'),
    notify = require("gulp-notify"),
    browserSync = require('browser-sync').create(),
    concat = require('gulp-concat'),
    uglify = require( 'gulp-uglify' ),
    imagemin = require('gulp-imagemin'),
    cheerio = require('gulp-cheerio'),
    replace = require('gulp-replace'),
    svgSprite = require('gulp-svg-sprite'),
    svgmin = require('gulp-svgmin'),

// Name of working theme folder
root = '../' + themename + '/',
scss = root + 'sass/',
css = root + 'assets/css/',
js = root + 'assets/js/',
js_dev = root + 'js/',
src = root + 'src/',
img = root + 'assets/images/',
languages = root + 'languages/';

gulp.task('serve', function() {
  browserSync.init(
    [
      root + 'assets/css/*.min.css',
      root + 'assets/js/*.min.js',
      root + '**/*.php'
    ],
    {
      open: 'local',
      proxy: 'https://upworks.dev',
      browser: 'chrome',
      notify: false,
      https: {
        key: "e:/OpenServer/userdata/config/cert_files/localhost/localhost-server.key",
        cert: "e:/OpenServer/userdata/config/cert_files/localhost/localhost-server.crt"
      }
    }
  );
});

gulp.task('sass', function() {
  return gulp.src(scss + '{style.scss,woocommerce.scss,rtl.scss}')
        .pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(sass({
          outputStyle: 'expanded',
          indentType: 'tab',
          indentWidth: '1',
          includePaths: [css]
        }).on('error', sass.logError))
        .pipe(postcss([
          autoprefixer('last 10 versions', '> 1%')
        ]))
        .on("error", notify.onError({
          message: "Error: <%= error.message %>",
          title: "style"
        }))
        .pipe(sourcemaps.write(undefined, { sourceRoot: null }))
        .pipe(gulp.dest(css));
});

gulp.task( 'minifycss', function() {
  return gulp.src( css + '{style.css,woocommerce.css,rtl.css}' )
  .pipe( sourcemaps.init( { loadMaps: true } ) )
    .pipe( cleanCSS( { compatibility: '*' } ) )
    .pipe( plumber( {
            errorHandler: function( err ) {
                console.log( err ) ;
                this.emit( 'end' );
            }
        } ) )
    .pipe( rename( { suffix: '.min' } ) )
     .pipe( sourcemaps.write( './' ) )
    .pipe( gulp.dest( css ) )
    .pipe(browserSync.reload({
      stream: true
    }));
});

gulp.task('style', gulp.series('sass', 'minifycss'));

gulp.task('libs:css', function() {
  return gulp.src(src + 'css/*.css')
        .pipe(concat('libs.min.css'))
        .pipe( cleanCSS( { compatibility: '*' } ) )
        .pipe(gulp.dest(css))
        .pipe(browserSync.reload({
          stream: true
        }));
});

gulp.task('libs:js', function() {
  return gulp.src(src + 'js/*.js')
        .pipe(concat('libs.min.js'))
        .pipe( uglify() )
        .pipe(gulp.dest(js))
        .pipe(browserSync.reload({
          stream: true
        }));
});

gulp.task('script:min', function() {
  return gulp.src([js_dev + '*.js', '!' + js_dev + 'customizer.js', '!' + js_dev + '*.inc.js'])
    .pipe( concat( 'scripts.min.js' ) )
    .pipe( uglify() )
    .pipe(gulp.dest(js))
    .pipe(browserSync.reload({
      stream: true
    }));
});

gulp.task('script:add', function() {
  return gulp.src([js_dev + 'customizer.js', js_dev + '*.inc.js'])
    .pipe( uglify() )
    .pipe(gulp.dest(js))
    .pipe(browserSync.reload({
      stream: true
    }));
});

gulp.task('script', gulp.parallel('script:min', 'script:add'));

gulp.task('img:dev', function() {
  return gulp.src(src + 'img/*')
        .pipe(gulp.dest(img));
});

gulp.task('img:build', function() {
    gulp.src(src + 'img/*')
    .pipe(imagemin())
    .pipe( gulp.dest(img));
});

gulp.task('svg', function() {
  return gulp.src(src + 'img/svg/*.svg')
        .pipe(svgmin({
          js2svg: {
            pretty: true
          }
        }))
        .pipe(cheerio({
          run: function($) {
            $('[fill]').removeAttr('fill');
            $('[stroke]').removeAttr('stroke');
            $('[style]').removeAttr('style');
          },
          parserOptions: {
            xmlMode: true
          }
        }))
        .pipe(replace('&gt;', '>'))
        .pipe(svgSprite({
          mode: {
            symbol: {
              sprite: "sprite.svg"
            }
          }
        }))
        .pipe(gulp.dest(img + 'svg'));
});

gulp.task('watch', function() {
  gulp.watch(scss + '**/*.scss', gulp.series('style'));
  gulp.watch(js_dev + '**/*.js', gulp.series('script'));
  gulp.watch(src + 'img/**', gulp.series('img:dev'));
});

// "gulp"
gulp.task('default', gulp.series(
  gulp.parallel('style', 'libs:js', 'libs:css', 'script', 'img:dev', 'svg'),
  gulp.parallel('watch', 'serve')
));

// first start fot initialize all css and js files
// "gulp build"
gulp.task('build', gulp.series(
  gulp.parallel('style', 'libs:js', 'libs:css', 'script', 'img:build', 'svg'),
  gulp.parallel('watch', 'serve')
));
