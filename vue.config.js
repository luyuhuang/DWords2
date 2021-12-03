module.exports = {
    publicPath: './',
    outputDir: './renderer',
    pages: {
        home: {
            entry: 'templates/home.js',
            template: 'templates/home.html',
            filename: 'home.html',
        },
        danmaku: {
            entry: 'templates/danmaku.js',
            template: 'templates/danmaku.html',
            filename: 'danmaku.html',
        },
        about: {
            entry: 'templates/about.js',
            template: 'templates/about.html',
            filename: 'about.html',
        },
        displayArea: {
            entry: 'templates/displayArea.js',
            template: 'templates/displayArea.html',
            filename: 'displayArea.html',
        },
    }
};
