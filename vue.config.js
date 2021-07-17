module.exports = {
    publicPath: './',
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
    }
}
