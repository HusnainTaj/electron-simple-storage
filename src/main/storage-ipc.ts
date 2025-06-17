import { StoreConfig } from '../types';
import { Store } from '.';

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
