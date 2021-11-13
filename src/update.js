const { app, dialog, shell } = require('electron');
const got = require('got');
const { compareVersions, getMainWin, getSys, setSys } = require('./utils');

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
    const ignoredVersion = await getSys('ignoredVersion');
    const ignored = ignoredVersion && compareVersions(version, ignoredVersion) <= 0;
    if (slience && ignored) return;
    if (compareVersions(version, app.getVersion()) > 0) {
        const {response, checkboxChecked} = await dialog.showMessageBox(getMainWin(), {
            type: 'info',
            message: `New version ${version} available`,
            detail: note,
            checkboxLabel: 'Ignore this version',
            checkboxChecked: ignored,
            buttons: ['download', 'later'],
        });
        if (response === 0) {
            shell.openExternal('https://github.com/luyuhuang/DWords2/releases/latest');
        }
        if (checkboxChecked) {
            await setSys('ignoredVersion', version);
        } else {
            await setSys('ignoredVersion', undefined);
        }
    } else if (!slience) {
        dialog.showMessageBox(getMainWin(), {
            type: 'info',
            message: `Up to date`,
            detail: `Current version: ${app.getVersion()}`,
        });
    }
}

module.exports = {
    checkUpdate,
};
