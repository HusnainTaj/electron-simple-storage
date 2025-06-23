import { join } from "node:path";
import * as fs from "node:fs";
import { app, BrowserWindow } from "electron";

export type StoreConfig<T> = {
    filename: string;
    key: string;
    fallback: T;
};

// https://github.com/typicode/lowdb // maybe use with this
export class Store<T>
{
    private filePath: string;
    constructor(private config: StoreConfig<T>)
    {
        this.filePath = join(app.getPath("userData"), `${this.config.filename}.json`);
        fs.mkdirSync(app.getPath("userData"), { recursive: true });
        if (!fs.existsSync(this.filePath))
        {
            fs.writeFileSync(this.filePath, JSON.stringify({}));
        }
    }

    get(): T
    {
        const data = JSON.parse(fs.readFileSync(this.filePath, "utf-8"));
        return data[this.config.key] !== undefined ? data[this.config.key] : this.config.fallback;
    }

    set(value: T): void
    {
        const data = JSON.parse(fs.readFileSync(this.filePath, "utf-8"));
        data[this.config.key] = value;
        fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));

        for (const window of BrowserWindow.getAllWindows())
        {
            window.webContents.send('electron-simple-storage:changed', this.config.filename, this.config.key, value);
        }
    }

    delete(): void
    {
        const data = JSON.parse(fs.readFileSync(this.filePath, "utf-8"));
        delete data[this.config.key];
        fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
    }

    clear(): void
    {
        fs.writeFileSync(this.filePath, JSON.stringify({}));
    }
}

export function setupStorageIPC(ipcMain: Electron.IpcMain)
{
    // Using "any" type for StoreConfig here for generic compatibility.
    // It is the job of preload to ensure the correct type is used.

    ipcMain.handle('electron-simple-storage:get', async (_: any, config: StoreConfig<any>) =>
    {
        try
        {
            const store = new Store(config);
            return store.get();
        }
        catch (error)
        {
            console.error('Error getting storage item:', error)
            throw error
        }
    });

    ipcMain.handle('electron-simple-storage:set', async (_, config: StoreConfig<any>, value: any) =>
    {
        try
        {
            const store = new Store(config);
            store.set(value);
            return true;
        } catch (error)
        {
            console.error('Error setting storage item:', error)
            throw error
        }
    });

    ipcMain.handle('electron-simple-storage:delete', async (_, config: StoreConfig<any>) =>
    {
        try
        {
            const store = new Store(config);
            store.delete();
            return true;
        } catch (error)
        {
            console.error('Error deleting storage item:', error)
            throw error
        }
    });

    ipcMain.handle('electron-simple-storage:clear', async (_, config: StoreConfig<any>) =>
    {
        try
        {
            const store = new Store(config);
            store.clear();
            return true;
        } catch (error)
        {
            console.error('Error clearing storage item:', error)
            throw error
        }
    });
}