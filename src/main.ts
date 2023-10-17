import {app, dialog, Menu, Tray} from "electron";
import * as path from "path";
import {favicon} from "./favicon";
import * as storage from 'electron-json-storage';
import * as fs from "fs";
import {makeScript} from "./bashScript";

const dataFileName = "dataFile.txt"
const scriptFileName = "bashScript.sh"

let tray: null | Tray = null;

const localStorageKey = 'battery_optimizer_data_path';

const makeDataFilePath = (dataFolder: string) => path.join(dataFolder, dataFileName);
const makeScriptFilePath = (dataFolder: string) => path.join(dataFolder, scriptFileName);

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

function setDataObject(newObject: any) {
    return new Promise(function (resolve, _) {
        storage.set(localStorageKey, newObject, resolve);
    });
}

async function getDataFolder() {
    const dataObject = storage.getSync(localStorageKey);

    if ('path' in dataObject) {
        return (dataObject as { path: string }).path;
    } else {
        const newPath = dialog.showOpenDialogSync({properties: ['openDirectory']})[0];

        if (newPath) {
            // Use newPath and update the storage
            storage.set(localStorageKey, {path: newPath}, () => 1);
            await setDataObject({path: newPath})
            return newPath;
        } else {
            // Handle the case when the user cancels folder selection
            app.quit();
        }
    }
}

function getCurrentCutoffUnixTime(dataFolder: string) {
    const dataFilePath = makeDataFilePath(dataFolder);

    if (fs.existsSync(dataFilePath)) {
        const fileContent = fs.readFileSync(dataFilePath).toString();
        return tryParseInt(fileContent);
    } else {
        return null;
    }
}

async function getAndSetupDataFolder() {
    const dataFolder = await getDataFolder();
    const dataFilePath = makeDataFilePath(dataFolder);
    const scriptFilePath = makeScriptFilePath(dataFolder);

    // Check if the script file exists and create it if not
    if (!fs.existsSync(scriptFilePath)) {
        fs.writeFileSync(scriptFilePath, makeScript(dataFilePath));
    }

    return dataFolder;
}

async function fullReset(dataPathFolder: string | null) {
    await setDataObject({})

    if (dataPathFolder != null) {
        // Remove files, ignoring any FS errors
        try {
            fs.unlinkSync(makeDataFilePath(dataPathFolder));
        } catch (err) {
            console.log(`Error: ${err.message}`)
        }
        try {
            await fs.unlinkSync(makeScriptFilePath(dataPathFolder));
        } catch (err) {
            console.log(`Error: ${err.message}`)
        }
    }
}

app.whenReady().then(async () => {
    let dataFolder = await getAndSetupDataFolder();
    console.log(dataFolder);

    tray = new Tray(favicon);

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Disable >80% notifications for 60 minutes',
            type: 'normal',
            click: async (clickedItem, window, keyboardEvent) => {
                const dataFilePath = makeDataFilePath(dataFolder);
                const currentTime = Math.floor(Date.now() / 1000);
                // Set datafile content to the UNIX timestamp of NOW + 60 minutes
                fs.writeFileSync(dataFilePath, (currentTime + 3600).toString());
            }
        },
        {
            label: 'Enable >80% notifications',
            type: 'normal',
            click: async (clickedItem, window, keyboardEvent) => {
                const dataFilePath = makeDataFilePath(dataFolder);
                // Remove datafile
                try {
                    fs.unlinkSync(dataFilePath);
                } catch (err) {
                    console.log(`Error: ${err.message}`)
                }
            }
        },
        {
            label: 'Full reset',
            type: 'normal',
            click: async (clickedItem, window, keyboardEvent) => {
                await fullReset(dataFolder);
                dataFolder = await getAndSetupDataFolder();
            }
        },
        {
            label: 'Exit',
            type: 'normal',
            click: async (clickedItem, window, keyboardEvent) => {
                app.quit()
            }
        }
    ]);

    tray.setToolTip('Battery optimizer');
    tray.setContextMenu(contextMenu);
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});
