# electron-simple-storage

A simple reactive storage solution for Electron apps, using JSON files to store data.

## Features

-   Basic CRUD operations
-   Data is stored in a JSON file
-   Works with both Electron's main and renderer processes
-   Supports watching for changes (made in main or renderer) in renderer processes
-   No need for enabling `nodeIntegration` in the window

## Installation

```bash
npm install electron-simple-storage
```

## Usage

### 1. Create Stores

```typescript
// in a shared file (e.g., stores.ts)
import { StoreConfig } from "electron-simple-storage";

// keys of this object are arbitrary identifiers for your stores
export const StoreConfigs = {
	"settings:run-at-start": {
		// the file where this data will be stored, settings.json in this case
		filename: "settings",
		// the key in the json file for this data
		key: "run-at-start",
		// default initial value, incase this key does not exist in file
		fallback: true,
	} as StoreConfig<boolean>, // make sure to specify the type of the value for better type safety

	// Example of multiple values in a single json file
	// profile.json will contain username and email keys
	"profile:username": {
		filename: "profile",
		key: "username",
		fallback: "Guest",
	} as StoreConfig<string>,
	"profile:email": {
		filename: "profile",
		key: "email",
		fallback: "",
	} as StoreConfig<string>,

	// Example of single value in a single json file
	// interval key in interval.json
	interval: {
		filename: "interval",
		key: "interval",
		fallback: 1000,
	} as StoreConfig<number>,
};
```

### 2. Setup Main IPC

```typescript
// in your main process file (e.g., main.ts)
import { app, ipcMain } from "electron";
import { setupStorageIPC } from "electron-simple-storage";

app.whenReady().then(() => setupStorageIPC(ipcMain));
```

### 3. Setup Preload IPC

```typescript
// in your preload script (e.g., preload.ts)
import { contextBridge, ipcRenderer } from "electron";
import { setupRendererStore } from "~/node_modules/electron-simple-storage/dist/preload"; // must be imported directly
import { StoreConfigs } from "path/to/stores.ts"; // update with your actual path to file where stores were defined in step 1

declare global {
	interface Window {
		App: typeof API;
	}
}

const API = {
	usernameStore: setupRendererStore(ipcRenderer, StoreConfigs["profile:username"]),
	intervalStore: setupRendererStore(ipcRenderer, StoreConfigs.interval),
};

contextBridge.exposeInMainWorld("App", API);
```

### 4a. Use in Main Process

```typescript
import { Store } from "electron-simple-storage";
import { StoreConfigs } from "path/to/stores.ts"; // update with your actual path to file where stores were defined in step 1

const intervalStore = new Store(StoreConfigs.interval);
const usernameStore = new Store(StoreConfigs["profile:username"]);

// get value
const username = await usernameStore.get();

// set value
intervalStore.set(2000); // set interval to 2000ms

// watch not supported in main process yet
```

### 4b. Use in Renderer Process

```typescript
const { App } = window;

// get value
const username = await App.usernameStore.get();

// set value
App.intervalStore.set(2000); // set interval to 2000ms

// watch for changes
// changes by both the renderer and main processes will be detected!
App.intervalStore.watch((newInterval) => {
	console.log("Interval updated:", newInterval);
});
```

## API

`TODO`

## License

MIT
