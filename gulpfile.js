'use strict';

const gulp = require('gulp');

//pug
const pug = require('gulp-pug');
const fs = require('fs');
const data = require('gulp-data');
const path = require('path');
const plumber = require('gulp-plumber');
const notify = require('gulp-notify');
const browserSync = require('browser-sync');

//css
const sass = require('gulp-sass');
const sassGlob = require('gulp-sass-glob');
const postcss = require('gulp-postcss');
const flexBugsFixes = require('postcss-flexbugs-fixes');
const autoprefixer = require('autoprefixer'); //Sassにベンダープレフィックスをつける
const rename = require('gulp-rename'); //ファイルをリネーム

/**
 * 開発用のディレクトリを指定します。
 */
const src = {
  // 出力対象は`_`で始まっていない`.pug`ファイル。
  'html': ['src/**/*.pug', '!' + 'src/**/_*.pug'],
  // JSONファイルのディレクトリを変数化。
  'json': 'src/_data/',
  'css': 'src/**/*.css',
  'sass_style': ['src/**/*.scss', '!' + 'src/**/_*.scss'],
  //'styleguideWatch': 'src/**/*.scss',
  'js': 'src/**/*.js',
  'root': 'src/'
};

/**
 * 出力するディレクトリを指定します。
 */
const dest = {
  'root': 'dest/',
  'html': 'dest/'
};

/**
 * `.pug`をコンパイルしてから、destディレクトリに出力します。
 * JSONの読み込み、ルート相対パス、Pugの整形に対応しています。
 */
function html() {
  // JSONファイルの読み込み。
  var locals = {
    'site': JSON.parse(fs.readFileSync(src.json + 'site.json'))
  };
  return gulp.src(src.html)
  // コンパイルエラーを通知します。
  .pipe(plumber({errorHandler: notify.onError('Error: <%= error.message %>')}))
  // 各ページごとの`/`を除いたルート相対パスを取得します。
  .pipe(data(function (file) {
    locals.relativePath = path.relative(file.base, file.path.replace(/.pug$/, '.html'));
      return locals;
  }))
  .pipe(pug({
    // JSONファイルとルート相対パスの情報を渡します。
    locals: locals,
    // Pugファイルのルートディレクトリを指定します。
    // `/_includes/_layout`のようにルート相対パスで指定することができます。
    basedir: 'src',
    // Pugファイルの整形。
    pretty: true
  }))
  .pipe(gulp.dest(dest.html))
  .pipe(browserSync.reload({stream: true}));
}

/**
 * cssファイルをdestディレクトリに出力（コピー）します。
 */
function css() {
  return gulp.src(src.css, {base: src.root})
  .pipe(gulp.dest(dest.root))
  .pipe(browserSync.reload({stream: true}));
}


/**
 * sassファイルをdestディレクトリに同じ階層として出力（コピー）します。
 */
function sass_style() {
  const plugins = [flexBugsFixes(), autoprefixer({ // ベンダープレフィックスの付与
    browsers: ['last 3 version', 'ie >= 10','iOS >= 9.3', 'Android >= 4.4'], // (ベンダープレフィックスを付与する)対応ブラウザの指定
    cascade: true // 整形する
  })];
  return gulp.src(src.sass_style, {base: src.root})
      .pipe(sassGlob())
      .pipe(sass({
          outputStyle: 'expanded',
        }).on('error', sass.logError)
      )
      .pipe(plumber({ errorHandler: notify.onError('Error: <%= error.message %>') }))
      .pipe(postcss(plugins))
      // .pipe(rename(function (path) {
      //   path.dirname += '/css';
      // }))
      .pipe(gulp.dest(dest.root))
      .pipe(browserSync.reload({ stream: true }));
}



/**
 * jsファイルをdestディレクトリに出力（コピー）します。
 */
function js() {
  return gulp.src(src.js, {base: src.root})
  .pipe(gulp.dest(dest.root))
  .pipe(browserSync.reload({stream: true}));
}

/**
 * ローカルサーバーを起動します。
 */
function browser_sync(done) {
  browserSync({
    server: {
      baseDir: dest.root,
      index: 'index.html'
    }
  });
  done();
}

/**
 * PugのコンパイルやCSSとjsの出力、browser-syncのリアルタイムプレビューを実行します。
 */
function watchFiles(done) {
  gulp.watch(src.html).on('change', gulp.series(html));
  gulp.watch(src.sass_style).on('change', gulp.series(sass_style));
  gulp.watch(src.css).on('change', gulp.series(css));
  gulp.watch(src.js).on('change', gulp.series(js));
}

gulp.task('watch', gulp.series(gulp.parallel(html, sass_style, css, js), gulp.series(browser_sync, watchFiles)));


/**
 * 開発に使うタスクです。
 * package.jsonに設定をして、`npm run default`で実行できるようにしています。
 */
gulp.task('default', gulp.task('watch'));