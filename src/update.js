const { app, dialog, shell } = require('electron');
const got = require('got');
const { compareVersions } = require('./utils');

async function getLatestVersion() {
    const res = await got('https://api.github.com/repos/luyuhuang/DWords2/releases/latest');
    const info = JSON.parse(res.body);
    return {
        version: info.tag_name.substr(1),
        note: info.body,
    };
}

async function checkUpdate(slience) {
    const {version, note} = await getLatestVersion();
    if (compareVersions(version, app.getVersion()) > 0) {
        const {response} = await dialog.showMessageBox({
            message: `New version ${version} valuable\n${note}`,
            buttons: ['download', 'later'],
        });
        if (response === 0) {
            shell.openExternal('https://github.com/luyuhuang/DWords2/releases/latest');
        }
    } else if (!slience) {
        dialog.showMessageBox({
            message: `Up to date\n${app.getVersion()}`,
        });
    }
}

module.exports = {
    checkUpdate,
};
