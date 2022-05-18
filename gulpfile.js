import gulp from "gulp";
import del from "del";
import replace from "gulp-replace";
import rename from 'gulp-rename';
import plumber from "gulp-plumber";
import notify from "gulp-notify";
import browserSync from 'browser-sync';
import sass from 'gulp-dart-sass';
import autoprefixer from 'gulp-autoprefixer';
import csso from 'gulp-csso';
import babel from 'gulp-babel';
import uglify from 'gulp-uglify';
import cssSort from 'gulp-csscomb';
import newer from "gulp-newer";
import squoosh from 'gulp-libsquoosh';
import svgo from 'gulp-svgmin';
import svgstore from 'gulp-svgstore';

/**
 *  Основные директории
 */
const dirs = {
  src: 'src',
  dest: 'build'
};

const path = {
  build: {
    js: `${dirs.dest}/js/`,
    css: `${dirs.dest}/css/`,
    html: `${dirs.dest}/`,
    files: `${dirs.dest}/files/`,
    images: `${dirs.dest}/img/`,
    fonts: `${dirs.dest}/fonts/`,
  },
  src: {
    // js: `${dirs.src}/js/app.js`,
    js: `${dirs.src}/js/**/*.js`,
    scss: `${dirs.src}/scss/style.scss`,
    html: `${dirs.src}/*.html`,
    files: `${dirs.src}/files/**/*.*`,
    images: `${dirs.src}/img/**/*.{jpg,png,jpeg,gif}`,
    svg: `${dirs.src}/img/**/*.svg`,
    sprite: `${dirs.src}/img/sprite/*.svg`,
    fonts: `${dirs.src}/fonts/*.{woff,woff2}`,
  },
  watch: {
    js: `${dirs.src}/js/**/*.js`,
    scss: `${dirs.src}/scss/**/*.scss`,
    html: `${dirs.src}/**/*.html`,
    files: `${dirs.src}/files/**/*.*`,
    images: `${dirs.src}/img/**/*.{jpg,png,jpeg,gif,webp}`,
    sprite: `${dirs.src}/img/sprite/*.svg`,
    svg: `${dirs.src}/img/**/*.svg`,
  },
  clean: `${dirs.dest}`,
}

// Задачи

// Копирование файлов
const copy = () => {
  return gulp.src(path.src.files)
  .pipe(gulp.dest((path.build.files)));
}

// Очистка папки со сборкой
export const clean = () => {
  return del(path.clean);
}

// Сборка html файлов
const html = () => {
  return gulp.src(path.src.html)
    .pipe(replace(/@img\//g, 'img/')) // замена @img на img, не работает
    .pipe(gulp.dest(path.build.html))
    .pipe(browserSync.stream());
}

// Сортировка стилей
export const scssSort = () => {
  return gulp.src(path.watch.scss)
    .pipe(cssSort())
    .pipe(gulp.dest((file) => {
      return file.base;
    }));
}

// Сборка стилей
const styles = () => {
  return gulp.src(path.src.scss, { sourcemaps: true })
    .pipe(plumber())
    .pipe(replace(/@img\//g, '../img/'))
    .pipe(sass().on('error', sass.logError))
    .pipe(autoprefixer())
    .pipe(csso())
    .pipe(rename({
      extname: ".min.css"
    }))
    .pipe(gulp.dest(path.build.css))
    .pipe(browserSync.stream());
}

// Сборка скриптов
const scripts = () => {
  return gulp.src(path.src.js, { sourcemaps: true })
    .pipe(plumber(
      notify.onError({
        title: "JS",
        message: "Error: <%= error.message %>"
      })
    ))
    // .pipe(rename({
    //   suffix: '.min'
    // }))
    // .pipe(webpack({
    //   mode: 'development',
    //   output: {
    //     filename: 'app.min.js'
    //   }
    // }))
    .pipe(uglify())
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest(path.build.js))
    .pipe(browserSync.stream());
}

const server = (done) => {
  browserSync.init({
    server: path.build.html,
    notify: false,
    port: 3000
  });
}

// Оптимизация и копирование картинок в папку сборки
const images = () => {
  return gulp.src(path.src.images)
    .pipe(plumber(
      notify.onError({
        title: "IMAGES",
        message: "Error: <%= error.message %>"
      })
    ))
    .pipe(newer(path.build.images))
    .pipe(squoosh({
      webp: {}
    }))
    .pipe(gulp.dest(path.build.images))
    .pipe(gulp.src(path.src.images))
    .pipe(newer(path.build.images))
    .pipe(squoosh())
    .pipe(gulp.dest(path.build.images))
    .pipe(browserSync.stream());
}

// Оптимизация svg и копирование картинок в папку сборки
const svg = () =>{
  return gulp.src([path.src.svg, `!${path.src.sprite}`])
    .pipe(svgo())
    .pipe(gulp.dest(path.build.images));
}

// Создание спрайта
const sprite = () => {
  return gulp.src(path.src.sprite)
    .pipe(svgo())
    .pipe(svgstore({
      inlineSvg: true
    }))
    .pipe(rename('sprite.svg'))
    .pipe(gulp.dest(path.build.images));
}

const fonts = () => {
  return gulp.src(path.src.fonts)
    .pipe(gulp.dest(path.build.fonts));
}

// Наблюдатель за изменениями в файлах
function watcher() {
  gulp.watch(path.watch.files, copy);
  gulp.watch(path.watch.html, html);
  gulp.watch(path.watch.scss, styles);
  gulp.watch(path.watch.js, scripts);
  gulp.watch(path.watch.images, images);
  gulp.watch(path.watch.sprite, sprite);
  gulp.watch([path.src.svg, `!${path.src.sprite}`], svg);
}

const mainTasks = gulp.parallel(copy, fonts, html, styles, scripts, images, sprite, svg);

// Построение сценариев выполнения задач
export const dev = gulp.series(clean, mainTasks, gulp.parallel(watcher, server));
export const build = gulp.series(clean, mainTasks);

// Задача по умолчанию
gulp.task('default', dev);
