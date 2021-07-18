const {app, BrowserWindow, ipcMain, Tray, Menu, screen} = require('electron');
const path = require('path');

function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 600,
    minWidth: 580,
    minHeight: 420,
    frame: false,
    title: 'DWords',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  mainWindow.loadFile('dist/home.html');

}

function createDanmaku(word) {
  const danmaku = new BrowserWindow({
    show: false,
    useContentSize: true,
    resizable: false,
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    backgroundColor: '#00ffffff',
    hasShadow: false,
    alwaysOnTop: true,
    title: 'Danmaku',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  const screenSize = screen.getPrimaryDisplay().size;
  const x = screenSize.width;
  const y = Math.floor(Math.random() * screenSize.height / 3);

  danmaku.loadFile('dist/danmaku.html', {query: word});
  danmaku.showInactive();
  danmaku.setPosition(x, y);
  danmaku.setMenu(null);
  danmaku.setSkipTaskbar(true);
}

function showWindow() {
  let mainWindow = null;
  for (const win of BrowserWindow.getAllWindows()) {
    if (win.getTitle() === 'DWords') {
      mainWindow = win;
      break;
    }
  }

  if (mainWindow) {
    mainWindow.show();
  } else {
    createWindow();
  }
}

let tray;

app.whenReady().then(() => {
  createWindow();
  app.on('activate', showWindow);

  tray = new Tray('assets/img/logo@2x.png');
  tray.setToolTip('DWords');
  tray.setContextMenu(Menu.buildFromTemplate([
    {
      label: 'Exit',
      click() {
        app.quit();
      }
    }
  ]));
  tray.on('click', showWindow);
});

ipcMain.on('close', (event) => {
  const win = BrowserWindow.fromId(event.sender.id);
  win.hide();
});

ipcMain.on('setIgnoreMouseEvents', (event, ignore, options) => {
  const win = BrowserWindow.fromId(event.sender.id);
  win.setIgnoreMouseEvents(ignore, options);
});

ipcMain.on('setWinSize', (event, width, height) => {
  const win = BrowserWindow.fromId(event.sender.id);
  win.setSize(width, height);
});

app.on('window-all-closed', () => {})

setInterval(() => {
  BrowserWindow.getAllWindows().forEach((win) => {
    if (win.getTitle() === 'Danmaku') {
      const [x, y] = win.getPosition();
      if (x < 0) {
        win.close();
      } else {
        win.setPosition(x - 2, y);
      }
    }
  })
}, 20);

const words = [
  {
    word: 'syndicate',
    paraphrase: '企业联合',
    showParaphrase: false,
    color: 'dark',
  },
  {
    word: 'apple',
    paraphrase: '苹果',
    showParaphrase: false,
    color: 'red',
  },
  {
    word: 'convene',
    paraphrase: '集合',
    showParaphrase: false,
    color: 'orange',
  }
]

setInterval(() => {
  createDanmaku(words[Math.floor(Math.random() * words.length)]);
}, 5000);
