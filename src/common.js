const os = require('os');
const path = require('path');

exports.DICTIONARIES = {
    'en-en': {
        name: 'English-English',
        table: 'dict_en',
        field: 'paraphrase_en',
        tags: {
            gre: "GRE",
            toefl: "TOEFL",
            cet4: "CET-4",
            cet6: "CET-6",
            ielts: "IELTS",
        },
    },
    'en-zh': {
        name: 'English-Chinese',
        table: 'dict_en',
        field: 'paraphrase_zh',
        tags: {
            zk: "中考",
            gk: "高考",
            ky: "考研",
            cet4: "大学英语四级",
            cet6: "大学英语六级",
            gre: "GRE",
            toefl: "托福",
            ielts: "雅思",
        }
    },
};

exports.DATA_DIR = path.join(os.homedir(), '.DWords2');
exports.LOG_DIR = path.join(exports.DATA_DIR, 'logs');
