import { app, BrowserWindow, Menu, Tray  } from "electron";
import * as path from "path";
import {favicon} from "./favicon";
import * as storage  from 'electron-json-storage';
import { dialog } from 'electron'
import {makeScript} from "./bashScript"
import * as fs from "fs";

const dataPath = storage.getDataPath();
console.log(dataPath);
const dataFileName = "dataFile"
const scriptFileName = "dataFile"
let tray: null | Tray = null

const localStorageKey = 'battery_optimizer_data_path'
const makeDataFilePath = (dataFolder:string) => path.join(dataFolder, dataFileName)
const makeScriptFilePath = (dataFolder:string) => path.join(dataFolder, scriptFileName)

function tryParseInt(value: string): number | null {
  const parsedValue = parseInt(value, 10);

  if (isNaN(parsedValue)) {
    // Failed to parse. Return the default value.
    return null;
  } else {
    // Return the parsed value.
    return parsedValue;
  }
}

function getDataFolder() {
  const dataObject = storage.getSync(localStorageKey);
  if ('path' in dataObject) {
    return (dataObject as {path: string}).path;
  } else{
    const newPath = dialog.showOpenDialogSync({ properties: ['openDirectory'] })[0]
    // TODO: make own sync version of this method
    storage.set(localStorageKey, {path: newPath}, () => 1)
    return newPath
  }
}

function getCurrentCutoffUnixTime(dataFolder: string){
  const dataFilePath = makeDataFilePath(dataFolder)
  if (fs.existsSync(dataFilePath)){
    const fileContent = fs.readFileSync(dataFilePath).toString()
    return tryParseInt(fileContent)
  }else{
    return null;
  }
}

function getAndSetupDataFolder(){
  const dataFolder = getDataFolder()
  const dataFilePath = makeDataFilePath(dataFolder)
  const scriptFilePath = makeScriptFilePath(dataFolder)
  fs.writeFileSync(scriptFilePath, makeScript(dataFilePath))
  return dataFolder
}

function fullReset(dataPathFolder: string | null) {
  // TODO: make own sync version of this method
  storage.set(localStorageKey, {}, () => 1);

  if (dataPathFolder != null){
    // TODO: remove files, ignoring any FS errors
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {

  console.log(getAndSetupDataFolder())
  tray = new Tray(favicon)

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Disable >80% notifications for 60 minutes', type: 'radio', click: (clickedItem, window, keyboardEvent)=> {
      /*TODO: set datafile content to unix timestamp of NOW + 60 minutes*/
    } },
    { label: 'Enable >80% notification', type: 'radio', click: (clickedItem, window, keyboardEvent)=> {
        /*TODO: remove datafile*/
      }}
  ])
  tray.setToolTip('Battery optimizer')
  tray.setContextMenu(contextMenu)
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
