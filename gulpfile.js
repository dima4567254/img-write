// сделать что бы контейнер создавался на 24 строчке на пирример
const scss = require('gulp-sass')(require('sass'));

const {
  src,
  dest,
  watch,
  parallel,
  series
} = require('gulp');

// пути
const fontsFile = 'app/scss/_fonts.scss'
const srcFolder = 'app/fonts';
const fonts = 'app/fonts/*'

const concat = require('gulp-concat');
const autoPrefixer = require('gulp-autoprefixer');
const uglify = require('gulp-uglify');
const imagemin = require('gulp-imagemin');
const del = require('del');
// const browserSync = require('browser-sync').create();
const svgSprite = require('gulp-svg-sprite');
const ttf2woff = require('gulp-ttf2woff');
const ttf2woff2 = require('gulp-ttf2woff2');
const fs = require('fs-extra')
const newer = require('gulp-newer'); // Проверка обновления
const webp = require('gulp-webp');
const versionNumber = require('gulp-version-number');
// const gulpwebphtmlnosvg = require('gulp-webp-html-nosvg');
// const replace = require('gulp-replace'); // Поиск и замена
//версии

const avif = require('gulp-avif'); //версии
const gulpIgnore = require('gulp-ignore');
const avifcss = require('gulp-avif-css');
const groupMedia = require('gulp-group-css-media-queries');
const htmlmin = require('gulp-htmlmin');
const pictureHtml = require('gulp-webp-avif-html-nosvg-nogif-lazyload');
const csso = require('gulp-csso');
const plumber = require('gulp-plumber');

const express = require('express');//для чтения вроде картинок
// const fs = require('fs');
const path = require('path');//вынести
const browserSync = require('browser-sync').create();
const cheerio = require('cheerio');//для записи картинок

function ttfToWoff() {
  return src('app/fonts/*')
    .pipe(ttf2woff())
    .pipe(dest('app/fonts'))
    .pipe(src(`${fonts}`))
    .pipe(ttf2woff2())
    .pipe(dest('app/fonts'));
}

function fontsStyle() {
  fs.readdir(srcFolder, function (err, fontsFiles) {
    if (fontsFiles) {
      //проверяем существует ли файл стилей для подключения шрифтов
      if (!fs.existsSync(fontsFile)) {
        //если файла нет создаем его
        fs.writeFile(fontsFile, '', cb);
        let newFileOnly;
        for (var i = 0; i < fontsFiles.length; i++) {
          //записываем подключения шрифтов в файл стилей 
          let fontFileName = fontsFiles[i].split('.')[0];
          if (newFileOnly !== fontFileName) {
            let fontName = fontFileName.split('-')[0] ? fontFileName.split('-')[0] : fontFileName;
            let fontWeight = fontFileName.split('-')[1] ? fontFileName.split('-')[1] : fontFileName;
            if (fontWeight.toLowerCase() === 'thin') {
              fontWeight = 100;
            } else if (fontWeight.toLowerCase() === 'extralight') {
              fontWeight = 200;
            } else if (fontWeight.toLowerCase() === 'light') {
              fontWeight = 300;
            } else if (fontWeight.toLowerCase() === 'medium') {
              fontWeight = 500;
            } else if (fontWeight.toLowerCase() === 'semibold') {
              fontWeight = 600;
            } else if (fontWeight.toLowerCase() === 'bold') {
              fontWeight = 700;
            } else if (fontWeight.toLowerCase() === 'extrabold') {
              fontWeight = 800;
            } else if (fontWeight.toLowerCase() === 'black') {
              fontWeight = 900;
            } else {
              fontWeight = 400;
            }
            fs.appendFile(fontsFile, `@font-face {\n\tfont-family: '${fontName}';\n\tfont-weight:${fontWeight};\n\tfont-style:normal;\n\tsrc: url("../fonts/${fontFileName}.woff2") format("woff2"), url("../fonts/${fontFileName}.woff") format("woff");\n\tfont-display:swap;\n}\r\n`, cb);
            newFileOnly = fontFileName;
          }
        }
      } else {
        //если есть файл,выводим сообщение
        console.log("файл scss/fonts.scss уже существует. Для обновления нужноно его удалить")
      }
    }
  });
  return src(`${srcFolder}`);

  function cb() { }
}

function buildSvg() {//перенести в низ!!!
  return src('app/images/sprite/**/*.svg')
    .pipe(svgSprite({
      mode: {
        stack: {
          sprite: '../sprite.svg',
          // example: true//!!!
        }
      }
    }))
    .pipe(dest('app/images'));//!!!
}
// imgwrite()
function imgwrite() {
  const fs = require('fs');
  const cheerio = require('cheerio');
  const path = require('path');
  // Указываем путь к вашему HTML-файлу
  const filePath = path.join(__dirname, 'app/index.html');

  // Для работы с изображениями используем файл
  const imagePathsFile = path.join(__dirname, 'imagePaths.json');

  // Чтение путей изображений из файла
  fs.readFile(imagePathsFile, 'utf8', (err, data) => {
    if (err) {
      console.error('Ошибка при чтении файла с путями изображений:', err);
      return;
    }

    // Парсим данные JSON
    const imagePaths = JSON.parse(data);

    // Если пути найдены, обновляем HTML
    if (imagePaths.length > 0) {
      updateHtmlWithImages(imagePaths);
    } else {
      console.error('Пути к изображениям не найдены в файле.');
    }
  });

  // Функция для обновления HTML с новыми изображениями
  function updateHtmlWithImages(imagePaths) {
    // Чтение HTML-файла
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error('Ошибка при чтении HTML-файла:', err);
        return;
      }

      // Загружаем HTML с помощью Cheerio
      const $ = cheerio.load(data);

      // Создаём контейнер для изображений
      const imageContainer = $('<div id="image-container">\n');

      // Добавляем новые теги <img> в контейнер
      imagePaths.forEach(imagePath => {
        imageContainer.append(`    <img class="__img" src="${imagePath}" alt="">\n`);
      });

      imageContainer.append('  </div>'); // Закрываем контейнер

      // Заменяем существующий контейнер в HTML
      $('#image-container').replaceWith(imageContainer);

      // Записываем обновлённый текст обратно в файл
      fs.writeFile(filePath, $.html(), 'utf8', (err) => {
        if (err) {
          console.error('Ошибка при записи в файл:', err);
        } else {
          console.log('Файл успешно обновлён с новыми изображениями.');
        }
      });
    });
  }
}

function browsersync() {
  // надо еще сделать что бы оно обновлялось при добовлении картинки
  // browserSync.init({
  //   server: {
  //     baseDir: 'app/'
  //   },
  //   notify: false
  // })

  const app = express();
  const PORT = 3002;

  // Статическая папка для CSS и изображений
  app.use(express.static(path.join(__dirname, 'app')));

  // Разрешаем CORS
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
  });

  // Функция для рекурсивного поиска изображений
  function getImages(dir) {
    let results = [];
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat && stat.isDirectory()) {
        // Пропускаем указанные папки
        if (!['dist', 'scripts', 'icon'].includes(file)) {
          results = results.concat(getImages(filePath)); // Рекурсивный вызов
        }
      } else if (/\.(jpg|jpeg|png|gif)$/i.test(file)) {
        results.push(path.relative(path.join(__dirname, 'app'), filePath).replace(/\\/g, '/')); // Формируем относительный путь
      }
    });

    return results;
  }

  // Получение списка изображений
  app.get('/api/images', (req, res) => {
    const imagesDir = path.join(__dirname, 'app/images');

    try {
      const images = getImages(imagesDir);

      if (images.length === 0) {
        console.warn('Изображений не найдено в папке:', imagesDir);
        return res.status(404).json({ error: 'Изображений не найдено' });
      }

      console.log('Найдены изображения:', images);
      res.json(images);
    } catch (err) {
      console.error('Ошибка чтения папки с изображениями:', err);
      return res.status(500).json({ error: 'Ошибка чтения папки с изображениями' });
    }
  });

  // Запуск сервера
  const server = app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
  });

  // Настройки BrowserSync
  function startBrowserSync() {
    browserSync.init({
      proxy: `http://localhost:${PORT}`, // Прокси на сервер Express
      notify: false,
      open: false // Отключаем автоматическое открытие браузера
    });

    // Обновление страницы при изменении файлов в папке 'app'
    watch('app/**/*.*').on('change', browserSync.reload);
  }

  // Запуск BrowserSync после запуска сервера
  server.on('listening', startBrowserSync);
  // ----------------------------------------------------
  // потом проверить нужен ли код ниже
  // Функция для отображения изображений
  function displayImages(images) {
    const imageContainer = document.getElementById('image-container');
    imageContainer.innerHTML = ''; // Очищаем контейнер перед добавлением

    images.forEach(imageText => {
      const imgElement = document.createElement('img');
      imgElement.src = `${imageText}`; // Путь к изображению
      imgElement.alt = imageText;
      imageContainer.appendChild(imgElement);
    });
  }

  // Получаем изображения с сервера
  axios.get('http://localhost:3002/api/images')
    .then(response => {
      const imageArray = response.data;

      if (imageArray.length > 0 && typeof imageArray[0] === 'string') {
        // Сохраняем пути изображений в Local Storage
        imageArray.forEach((imagePath, index) => {
          localStorage.setItem(`imagePath_${index}`, imagePath);  // Сохраняем каждый путь под уникальным ключом
          console.error(imageArray[0], imageArray[1], 'пути');
        });

        // Отображаем изображения
        displayImages(imageArray);
        console.log('Пути к изображениям успешно сохранены в Local Storage.');
      } else {
        console.error('Ошибка: массив изображений пуст или содержит неверные данные.');
      }
    })
    .catch(error => {
      console.error('Ошибка при запросе изображений:', error);
    });


}

function styles() {
  return src('app/scss/style.scss')
    .pipe(scss({ outputStyle: 'expanded' }))//делает из csss css + читаемыq код
    .pipe(groupMedia())
    .pipe(avifcss())//подключает авиф и вебп
    .pipe(scss({
      outputStyle: 'compressed'
    }))
    .pipe(concat('style.min.css'))
    .pipe(autoPrefixer({
      overrideBrowserslist: ['last 10 versions'],
      grid: true
    }))
    .pipe(scss({ outputStyle: 'expanded' }))//удалить //делает код читабельным
    .pipe(csso())
    .pipe(dest('app/css'))
    .pipe(browserSync.stream())
}

function scripts() {
  return src([
    'node_modules/jquery/dist/jquery.js',
    // 'node_modules/swiper/swiper-bundle.js',
    // 'node_modules/jquery-form-styler/dist/jquery.formstyler.js',
    // 'node_modules/@fancyapps/fancybox/dist/jquery.fancybox.js',
    // 'node_modules/slick-carousel/slick/slick.js',
    // 'node_modules/ion-rangeslider/js/ion.rangeSlider.js',
    // 'node_modules/mixitup/dist/mixitup.js',
    // 'node_modules/rateyo/src/jquery.rateyo.js',                    
    // 'node_modules/jquery-form-styler/dist/jquery.formstyler.js',
    'app/js/main.js'
  ])
    .pipe(concat('main.min.js'))
    .pipe(uglify())
    .pipe(dest('app/js'))
    .pipe(browserSync.stream())
}

function images() {
  return src(['app/images/**/*.*', '!app/images/dist/**'])
    .pipe(gulpIgnore.exclude('app/images/dist/**'))
    .on('data', function (file) {
      console.log('Processing:', file.relative);
    })
    .pipe(plumber(function (err) {
      console.error('Error processing images:', err.message);
      this.emit('end');
    }))
    .pipe(gulpIgnore.exclude('**/*.svg'))//для авиф
    .pipe(gulpIgnore.exclude('**/*.ico'))//!!!
    .pipe(newer('app/images/dist'))
    .pipe(avif({ quality: 50 })).pipe(plumber(function (err) {
      console.error('Error processing images:', err.message);
      this.emit('end');
    }))
    .on('error', function (err) {
      console.error('Error processing image:', err.message);
    })
    .pipe(src(['app/images/**/*.*', '!app/images/dist/**']))
    .pipe(newer('app/images/dist'))
    .pipe(webp())
    .pipe(src(['app/images/**/*.*', '!app/images/dist/**']))//делает png
    .pipe(newer('app/images/dist'))
    .pipe(imagemin([
      imagemin.gifsicle({
        interlaced: true
      }),
      imagemin.mozjpeg({
        quality: 75,
        progressive: true
      }),
      imagemin.optipng({
        optimizationLevel: 1 //0-7
      }),
      imagemin.svgo({
        plugins: [{
          removeViewBox: true
        },
        {
          cleanupIDs: false
        }
        ]
      })
    ]))
    .pipe(gulpIgnore.exclude('**/*.svg'))
    .pipe(gulpIgnore.exclude('**/*.ico'))
    .pipe(dest('app/images/dist',))
}

function build() {
  return src([
    'app/**/*.html',
    // 'app/images/dist',
    'app/images/dist/**/*',
    'app/images/**/*.ico',
    'app/images/**/*.svg',
    // 'app/images/**.svg',
    'app/extra/**/*',
    'app/css/style.min.css',
    'app/js/main.min.js',
    'app/fonts/**/*'
  ], {
    base: 'app'
  })
    .pipe(dest('dist'))
}

function version() {
  // прописывает в html код так что файлик даже не нужен
  return src('app/*.html')
    .pipe(
      versionNumber({
        'value': '%DT%',//дата время
        'append': {
          'key': '_v',
          'cover': 0,
          'to': [
            'css',
            'js',
          ]
        },
        'output': {
          'file': 'app/version.json'
        }
      }
      ))
    .pipe(dest('app'));
}

// !!!
function htmlmpicture() {
  return src('app/**/*.html')
    // .pipe(newer('app'))
    .pipe(pictureHtml({
      primaryFormat: 'avif',
      // primaryAfter: 'images/dist',
      // primaryBefore: 'images/avif/',
      secondaryFormat: 'webp',
      // secondaryAfter: 'images/dist',
      // secondaryBefore: 'images/webp/',
    })
    )
    .pipe(dest('app'))
}
// !!!
function htmlmins() {
  return src('dist/**/*.html')
    .pipe(htmlmin({
      useShortDoctype: true,
      sortClassName: true,
      removeComments: true,
      collapseWhitespace: true,
    }))
    .pipe(dest('dist'));
}

function watching() {
  watch(['app/scss/**/*.scss'], styles);
  watch('app/images/**/*.*', images);
  watch(['app/js/**/*.js', '!app/js/main.min.js'], scripts);
  watch(['app/**/*.html']).on('change', browserSync.reload);
}

function cleanDist() {
  return del('dist')
}

function AppIconsDel() {
  return del('app/images/dist/icons')///!!!
}

function iconsdel() {
  return del('dist/images/sprite')///!!!
}
function iconsdels() {
  return del('dist/images/dist/icons',)///!!!
}
function decordel() {
  return del('dist/images/dist/sprite')///!!!
}
// ------------------------------------------------------------------------------------------------------
// // ---------------------------------------------------------------------------------------------
// // ---------------------------------------------------------------------------------------------
// // ---------------------------------------------------------------------------------------------
// // ---------------------------------------------------------------------------------------------
// // ---------------------------------------------------------------------------------------------
// // ---------------------------------------------------------------------------------------------
exports.styles = styles;
exports.scripts = scripts;
exports.browsersync = browsersync;
exports.watching = watching;
exports.images = images;
exports.cleanDist = cleanDist;//htmlmins,htmlmpicture,decordel, iconsdels, iconsdel, //cleanDist,cleanapp,
exports.build = series(cleanDist, htmlmpicture, build, AppIconsDel, iconsdels, decordel, htmlmins, version,);//webp4, webp3, webp5 ,build, extra//iconsdel,buildSvg,
// exports.build = series();//webp4, webp3, webp5 ,build, extra//iconsdel,buildSvg,
// 
exports.default = parallel(styles, scripts, browsersync, watching, ttfToWoff, fontsStyle, version, imgwrite) //images
// ------------------------------------------------------------------------------------------------------
// // ---------------------------------------------------------------------------------------------
// // ---------------------------------------------------------------------------------------------
// // ---------------------------------------------------------------------------------------------
// // ---------------------------------------------------------------------------------------------
// // ---------------------------------------------------------------------------------------------
// // ---------------------------------------------------------------------------------------------
// // test
// // text на 0,7 +px
// и на дубли своиств
// const path = require('path');
// const fs = require('fs');

const cssFolderPath = path.join(__dirname, 'app/scss');

// Функция для удаления комментариев из CSS/SCSS кода
function removeComments(cssCode) {
  // Удаляем многострочные комментарии
  cssCode = cssCode.replace(/\/\*[\s\S]*?\*\//g, '');
  // Удаляем однострочные комментарии
  cssCode = cssCode.replace(/\/\/.*/g, '');
  return cssCode;
}

// Функция для проверки строки на наличие указанных CSS свойств со значением "0px" и "transition: ... 0."
function checkCssContent(cssContent) {
  cssContent = removeComments(cssContent);

  // Регулярные выражения для поиска указанных CSS свойств со значением "0px"
  let zeroPxProperties = [
    'margin-right',
    'margin-top',
    'margin-bottom',
    'margin-left',
    'padding-top',
    'padding-bottom',
    'padding-left',
    'padding-right',
    'width',
    'height',
    'margin',
    'padding',
    'top',
    'left',
    'inset',
    'letter-spacing',
    'max-width',
    'right',
    'bottom',
    'background-position'
  ];

  let zeroPxRegex = new RegExp(`\\b(${zeroPxProperties.join('|')}):\\s*(0px|0px 0px)\\b`, 'gi');
  let transitionRegex = /transition:\s*[^;]*\b0\.\d+s\b/g;
  let excludeRegex = /0(px|em|rem|%|vh|vw|vmin|vmax)/g;

  let matches = [];
  let lines = cssContent.split('\n');

  lines.forEach((line, index) => {
    const zeroPxMatches = line.match(zeroPxRegex);
    const transitionMatches = line.match(transitionRegex);

    if (zeroPxMatches) {
      zeroPxMatches.forEach(match => {
        matches.push({
          line: index + 1,
          content: line.trim(),
          type: '0px'
        });
      });
    }

    if (transitionMatches && !excludeRegex.test(line)) {
      transitionMatches.forEach(match => {
        matches.push({
          line: index + 1,
          content: line.trim(),
          type: '0.7'
        });
      });
    }
  });

  return matches;
}

// Функция для проверки файла и его содержимого
function checkFile(filePath, callback) {
  // Исключаем файл 'mexins.scss' из обработки
  const ignoredFiles = ['mexins.scss', 'vars.scss'];
  if (ignoredFiles.includes(path.basename(filePath))) {
    callback([]);
    return;
  }

  // Чтение CSS-кода из файла
  fs.readFile(filePath, 'utf8', (err, cssCode) => {
    if (err) {
      callback([]);
      return;
    }

    // Удаляем комментарии из кода
    cssCode = removeComments(cssCode);

    const matches = checkCssContent(cssCode);
    const duplicates = findDuplicateProperties(cssCode, filePath);
    const selectorDuplicates = findDuplicateSelectors(cssCode, filePath);

    callback([...matches, ...duplicates, ...selectorDuplicates]);
  });
}

// Функция для поиска дублирующих свойств в CSS
function findDuplicateProperties(cssCode, filePath) {
  const lines = cssCode.split('\n');
  let currentSelector = '';
  let properties = {};
  let duplicateProperties = [];
  let insideIgnoreBlock = false;

  lines.forEach((line, index) => {
    line = line.trim();

    if (line.endsWith('{')) {
      currentSelector = line.split('{')[0].trim();
      if (!properties[currentSelector]) {
        properties[currentSelector] = {};
      }
      insideIgnoreBlock = false;
    } else if (line.endsWith('}') || line === '}') {
      currentSelector = '';
      insideIgnoreBlock = false;
    } else if (currentSelector && line.includes(':')) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('&:focus') || trimmedLine.startsWith('&:hover') || trimmedLine.startsWith('&:active')) {
        insideIgnoreBlock = true;
      } else if (insideIgnoreBlock && trimmedLine.startsWith('}')) {
        insideIgnoreBlock = false;
      }

      if (!insideIgnoreBlock) {
        const [property, value] = line.split(':');
        const trimmedProperty = property.trim();
        if (properties[currentSelector][trimmedProperty]) {
          duplicateProperties.push({
            line: index + 1,
            content: `Дублирующее свойство в селекторе ${currentSelector}: ${trimmedProperty}`,
            type: 'duplicate property'
          });
        } else {
          properties[currentSelector][trimmedProperty] = true;
        }
      }
    }
  });

  return duplicateProperties;
}

// Упрощенная функция для поиска дублирующих селекторов в CSS
function findDuplicateSelectors(cssCode, filePath) {
  const lines = cssCode.split('\n');
  let selectors = new Set();
  let duplicateSelectors = [];
  let currentSelector = '';

  lines.forEach((line, index) => {
    line = line.trim();

    if (line.endsWith('{') || line.endsWith('}')) {
      currentSelector = line.split('{')[0].trim();
      if (selectors.has(currentSelector) && currentSelector !== '}') {
        duplicateSelectors.push({
          line: index + 1,
          content: `Дубль селектора: ${currentSelector}`,
          type: 'duplicate selector'
        });
      } else {
        selectors.add(currentSelector);
      }
    }
  });

  return duplicateSelectors;
}

// Функция для рекурсивного обхода всех файлов в директории
function checkDirectory(directoryPath, allMatches = [], callback) {
  // Папки и файлы, которые необходимо игнорировать
  const ignoredFolders = ['для интернет магазина', 'для лендинга'];

  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      console.error("Ошибка чтения директории:", err);
      return callback(allMatches);
    }

    if (files.length === 0) {
      return callback(allMatches);
    }

    let pending = files.length;

    files.forEach(file => {
      let filePath = path.join(directoryPath, file);

      // Проверка на игнорирование директорий
      if (ignoredFolders.some(folder => filePath.includes(folder))) {
        if (!--pending) callback(allMatches);
        return;
      }

      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.error("Ошибка получения информации о файле:", err);
          if (!--pending) callback(allMatches);
          return;
        }

        if (stats.isDirectory()) {
          checkDirectory(filePath, allMatches, () => {
            if (!--pending) callback(allMatches);
          });
        } else if (stats.isFile() && (file.endsWith('.css') || file.endsWith('.scss'))) {
          checkFile(filePath, (matches) => {
            allMatches = allMatches.concat(matches);
            if (!--pending) callback(allMatches);
          });
        } else {
          if (!--pending) callback(allMatches);
        }
      });
    });
  });
}

// Укажите путь к директории с файлами CSS и SCSS относительно текущего рабочего каталога
let directoryPath = path.resolve(__dirname, 'app/scss');

checkDirectory(directoryPath, [], (allMatches) => {
  if (allMatches.length === 0) {
    console.log('Ошибок не найдено');
  } else {
    allMatches.forEach(match => {
      console.log(match);
    });
  }
});
// -------------------------




// console.log('work');
// // const fs = require('fs');
// const filePath = path.join(__dirname, 'app/index.html'); // Абсолютный путь
// // const filePath = './app/index.html'; // Путь к вашему HTML-файлу

// const imagePath = 'images/dist/my-image.png'; // Ваш путь к изображению


// console.log('Путь к изображению:', imagePath);

// console.log(filePath);
// fs.readFile(filePath, 'utf8', (err, data) => {
//   if (err) {
//     console.error('Ошибка при чтении файла:', err);
//     return;
//   }

//   // Разделяем файл на строки
//   const lines = data.split('\n');

//   // Добавляем новый HTML на 25-ю строку
//   lines.splice(24, 0, `<img class="__img" src="${imagePath}" alt="">`);  // Индекс 24 для 25-й строки

//   // Объединяем строки обратно в один текст
//   const updatedData = lines.join('\n');

//   // Записываем обновлённый текст обратно в файл
//   fs.writeFile(filePath, updatedData, 'utf8', (err) => {
//     if (err) {
//       console.error('Ошибка при записи в файл:', err);
//     } else {
//       console.log('Файл успешно обновлён.');
//     }
//   });
// });

// // ----------------------------------------------
// const imageContainer = document.getElementById('image-container');

// fetch('http://localhost:3002/api/images')
//   // console.log('http://localhost:3002/api/images')
//   .then(response => {
//     if (!response.ok) {
//       throw new Error(`Ошибка сети: ${response.status} ${response.statusText}`);
//     }
//     return response.json();
//   })
//   .then(images => {
//     if (!Array.isArray(images)) {
//       throw new Error('Полученные данные не являются массивом.');
//     }

//     if (images.length === 0) {
//       imageContainer.innerHTML = 'Изображений не найдено.';
//       return;
//     }

//     images.forEach(image => {
//       const imgElement = document.createElement('img');
//       imgElement.src = `images/${image}`; // Путь к изображениям
//       imgElement.alt = image;
//       imageContainer.appendChild(imgElement);
//     });
//   })
//   .catch(error => {
//     imageContainer.innerHTML = 'Ошибка загрузки изображений.';
//     console.error('Ошибка:', error.message);
//   });
// // -----
// axioss()
// function axioss() {
//   const axios = require('axios');

//   axios.get('http://localhost:3002/api/images')
//     .then(response => {
//       const imageArray = response.data;
//       console.log('Массив изображений:', imageArray);

//       if (Array.isArray(imageArray)) {
//         imageArray.forEach(imageFileName => {
//           const imagePath = `images/${imageFileName}`; // Убедитесь, что это правильный путь
//           console.log('Путь к изображению:', imagePath);

//           const img = document.createElement('img');
//           img.src = imagePath;
//           img.alt = 'Image from API';
//           img.onload = () => console.log('Изображение загружено:', imagePath);
//           img.onerror = () => console.error('Ошибка загрузки изображения:', imagePath);
//           document.body.appendChild(img);
//         });
//       } else {
//         console.error('Полученные данные не являются массивом');
//       }
//     })
//     .catch(error => {
//       console.error('Ошибка при запросе:', error);
//     });

// }
// ------------------------------------------------------
// убрать в нужное место!!!

const axios = require('axios');
// const fs = require('fs');
// const path = require('path');

// Получаем изображения с сервера и сохраняем в файл
axios.get('http://localhost:3002/api/images')
  .then(response => {
    const imageArray = response.data;

    if (imageArray.length > 0 && typeof imageArray[0] === 'string') {
      // Путь к файлу для хранения путей изображений
      const filePath = path.join(__dirname, 'imagePaths.json');

      // Сохраняем пути изображений в файл
      fs.writeFile(filePath, JSON.stringify(imageArray), 'utf8', (err) => {
        if (err) {
          console.error('Ошибка при записи в файл:', err);
        } else {
          console.log('Пути к изображениям успешно сохранены в файл.');
        }
      });
    } else {
      console.error('Ошибка: массив изображений пуст или содержит неверные данные.');
    }
  })
  .catch(error => {
    console.error('Ошибка при запросе изображений:', error);
  });

//   const fs = require('fs');
// const path = require('path');

// Функция для отображения изображений
// function displayImages(images) {
//   console.log('Отображаем изображения:', images);
//   // Логика отображения в браузере останется в другом файле
// }

// Путь к файлу с путями изображений
// const filePath = path.join(__dirname, 'imagePaths.json');

// // Чтение путей изображений из файла
// fs.readFile(filePath, 'utf8', (err, data) => {
//   if (err) {
//     console.error('Ошибка при чтении файла:', err);
//     return;
//   }

//   const imagePaths = JSON.parse(data);

//   if (imagePaths.length > 0) {
//     // Отображаем изображения из файла
//     displayImages(imagePaths);
//   } else {
//     console.error('Пути к изображениям не найдены в файле.');
//   }
// });
