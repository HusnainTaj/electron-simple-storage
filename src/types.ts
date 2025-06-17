export type StoreConfig<T> = {
    filename: string;
    key: string;
    fallback: T;
};

export type RendererStore<T> = {
    get: () => Promise<T>;
    set: (value: T) => Promise<void>;
    delete: () => Promise<void>;
    clear: () => Promise<void>;
    watch: (callback: (value: T) => void) => () => void;
};

type getRendererStore = <T>(ipcRenderer: Electron.IpcRenderer, config: StoreConfig<T>) => RendererStore<T>