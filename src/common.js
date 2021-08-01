exports.DEFAULT_SETTINGS = {
    dictionary: 'en-en',
    maxCurrent: 10,
    autoRun: false,
    externalDictionaries: [
        {
            name: 'Merriam Webster Dictionary',
            url: 'https://www.merriam-webster.com/dictionary/',
        },
    ],

    danmakuSpeed: 10,
    danmakuFrequency: 5,
    danmakuTransparency: 50,
    defaultShowParaphrase: false,
    maxPharaphraseLen: 16,
    danmakuColor: 'red',
};

exports.DICTIONARIES = {
    'en-en': {name: 'English-English', table: 'dict_en', field: 'paraphrase_en'},
    'en-zh': {name: 'English-Chinese', table: 'dict_en', field: 'paraphrase_zh'},
};
