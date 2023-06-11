import { Entry } from "./Entry";
import { StorageDriver } from "./StorageDriver";

/**
 *  This is a driver that stores the data in-memory.
 * 
 *  Implementation notes:
 * 
 *  The class makes a lot of object copies. This is intentional, as the driver
 *  should minimize the possibility of reusing object instances. Most drivers
 *  will use an API or a database connection to work with and the nature of such
 *  will ensure that data returned from the driver is a new instance of data.
 *  With in-memory driver, we don't have this feature.
 */
export class MemoryDriver<TEntry extends Entry = Entry> implements StorageDriver<TEntry> {

    private _entries: { [ key: string]: TEntry } = { };

    async fetch(id: string): Promise<TEntry|undefined> {

        const entry = this.get(id);
        return entry ? Promise.resolve({...entry}) : Promise.resolve(undefined);
    }

    async insert(input: TEntry): Promise<void> {

        this._entries[input.id] = {...input};
        return Promise.resolve();
    }

    async update(input: TEntry): Promise<void> {
        
        const entry = this.get(input.id);
        const payload = entry ? { ...entry, ...input } : { ...input };

        this._entries[input.id] = payload;
    }

    private get(id: string) : TEntry|undefined {
        return this._entries[id];
    }
};
