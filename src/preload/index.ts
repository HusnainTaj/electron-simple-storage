import type { IpcRenderer } from "electron/renderer";
import { StoreConfig } from "../main";

export type RendererStore<T> = {
    get: () => Promise<T>;
    set: (value: T) => Promise<void>;
    update: (updater: (value: T) => T) => Promise<void>;
    delete: () => Promise<void>;
    watch: (callback: (value: T) => void) => () => void;
};

export function setupRendererStore<T>(ipcRenderer: IpcRenderer, config: StoreConfig<T>): RendererStore<T>
{
    return {
        get: async (): Promise<T> =>
        {
            return await ipcRenderer.invoke('electron-simple-storage:get', config) as T;
        },
        set: async (value: T, notify = true): Promise<void> =>
        {
            await ipcRenderer.invoke('electron-simple-storage:set', config, value, notify);
        },
        update: async (updater: (value: T) => T, notify = true): Promise<void> =>
        {
            const currentValue = await ipcRenderer.invoke('electron-simple-storage:get', config) as T;
            const newValue = updater(currentValue);
            await ipcRenderer.invoke('electron-simple-storage:set', config, newValue, notify);
        },
        delete: async (): Promise<void> =>
        {
            await ipcRenderer.invoke('electron-simple-storage:delete', config);
        },
        watch: (callback: (value: T) => void) =>
        {
            // @ts-ignore
            const listener = (event, _fileName, _key, value) =>
            {
                if (config.filename === _fileName && config.key === _key)
                {
                    callback(value);
                }
            };

            const a = ipcRenderer.on('electron-simple-storage:changed', listener);

            return () =>
            {
                a.off('electron-simple-storage:changed', listener);
            };
        }
    }
}