import { join } from "path";
import * as fs from "fs";
import { app, BrowserWindow } from "electron";
import { StoreConfig } from "../types";

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

export { setupStorageIPC } from "./storage-ipc";