// Modules to control application life and create native browser window
const {app, BrowserWindow} = require('electron')

// Keep a global reference of the window object
let mainWindow

function createWindow () {

  // Creates the browser window
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    },
    titleBarStyle: 'hidden',
    resizable: false,
    alwaysOnTop: false,
    fullscreen: false
  })

  // and load index.html
  mainWindow.loadFile('index.html')

  // Emitted when the window is closed
  mainWindow.on('closed', function () {

    // Dereference the window object
    mainWindow = null
  })

  app.clearRecentDocuments()

}

// Electron initiated
app.on('ready', createWindow)

// Quit when all windows are closed
app.on('window-all-closed', function () {

  // Quit app on macOs (darwin)
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {

  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open
  if (mainWindow === null) createWindow()
})
