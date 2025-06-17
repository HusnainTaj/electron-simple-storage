import { RendererStore, StoreConfig } from "../types";

export function setupRendererStore<T>(ipcRenderer: Electron.IpcRenderer, config: StoreConfig<T>): RendererStore<T>
{
    return {
        get: async (): Promise<T> =>
        {
            return await ipcRenderer.invoke('electron-simple-storage:get', config) as T;
        },
        set: async (value: T): Promise<void> =>
        {
            await ipcRenderer.invoke('electron-simple-storage:set', config, value);
        },
        delete: async (): Promise<void> =>
        {
            await ipcRenderer.invoke('electron-simple-storage:delete', config);
        },
        clear: async (): Promise<void> =>
        {
            await ipcRenderer.invoke('electron-simple-storage:clear', config);
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