import { join } from "node:path";
import * as fs from "node:fs";
import { app, BrowserWindow } from "electron";

export type StoreConfig<T> = {
    filename: ":memory:" | (string & {}); // hacky way to get ":memory:" in intellisense
    key: string;
    fallback: T;
};

// https://github.com/typicode/lowdb // maybe use with this
export class Store<T>
{
    private filePath: string | ":memory:";

    // Read data once and store it in memory, only update when a change is made
    // this allows us to avoid reading from file every time we need to get data
    // But this also means the data could be stale if some other process modifies the file directly
    // i.e. this only works for single process applications
    private data: any = undefined;

    constructor(private config: StoreConfig<T>)
    {
        if (config.filename === ":memory:")
        {
            this.filePath = ":memory:";
            console.info(`[Store] Creating in-memory store for ${config.key}`);
            this.data = {}; // initialize in-memory data
        }
        else
        {
            this.filePath = join(app.getPath("userData"), `${config.filename}.json`);
            fs.mkdirSync(app.getPath("userData"), { recursive: true });
            if (!fs.existsSync(this.filePath))
            {
                fs.writeFileSync(this.filePath, JSON.stringify({}));
            }
        }
    }

    private loadData(): void
    {
        if (this.data === undefined)
        {
            if (this.config.filename === ":memory:")
            {
                this.data = {};
                return; // do not read from file if inMemory is true
            }

            try
            {
                this.data = JSON.parse(fs.readFileSync(this.filePath, "utf-8"));
                console.log(`[Store] Loaded data from ${this.filePath}`);
            }
            catch (error)
            {
                console.error(`Error reading or parsing file ${this.filePath}:`, error);
                this.data = {};
            }
        }
    }

    private saveData(): void
    {
        if (this.config.filename === ":memory:") return; // do not write to file if inMemory is true

        try
        {
            fs.writeFileSync(this.filePath, JSON.stringify(this.data || {}, null, 2));
            console.log(`[Store] Saved data to ${this.filePath}`);
        } catch (error)
        {
            console.error(`Error writing to file ${this.filePath}:`, error);
            throw error; // rethrow to handle it in the IPC handler
        }
    }

    get(): T
    {
        this.loadData();
        return this.data[this.config.key] !== undefined ? this.data[this.config.key] : this.config.fallback;
    }

    set(value: T, notify = true): void
    {
        this.loadData();
        this.data[this.config.key] = value;
        this.saveData();

        if (notify)
        {
            for (const window of BrowserWindow.getAllWindows())
            {
                window.webContents.send('electron-simple-storage:changed', this.config.filename, this.config.key, value);
            }
        }
    }

    update(updater: (value: T) => T, notify = true): void
    {
        const currentValue = this.get();
        const newValue = updater(currentValue);
        this.set(newValue, notify);
    }

    delete(): void
    {
        this.loadData();
        delete this.data[this.config.key];
        this.saveData();
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

    ipcMain.handle('electron-simple-storage:set', async (_, config: StoreConfig<any>, value: any, notify = true) =>
    {
        try
        {
            const store = new Store(config);
            store.set(value, notify);
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
}