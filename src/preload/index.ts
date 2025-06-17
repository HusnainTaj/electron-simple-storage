import { StoreConfig } from "../types";

export function setupRendererStore<T>(ipcRenderer: Electron.IpcRenderer, config: StoreConfig<T>)
{
    return {
        get: async (): Promise<T> =>
        {
            return await ipcRenderer.invoke('store:get', config) as T;
        },
        set: async (value: T): Promise<void> =>
        {
            await ipcRenderer.invoke('store:set', config, value);
        },
        delete: async (): Promise<void> =>
        {
            await ipcRenderer.invoke('store:delete', config);
        },
        clear: async (): Promise<void> =>
        {
            await ipcRenderer.invoke('store:clear', config);
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

            const a = ipcRenderer.on('store:changed', listener);

            return () =>
            {
                a.off('store:changed', listener);
            };
        }
    }
}