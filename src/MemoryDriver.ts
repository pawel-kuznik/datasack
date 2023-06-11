import { Emitter, EmitterLike, EventHandler } from "@pawel-kuznik/iventy";
import { Entry } from "./Entry";
import { StorageDriver } from "./StorageDriver";
import { EventHandlerUninstaller } from "@pawel-kuznik/iventy/build/lib/Channel";

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
export class MemoryDriver<TEntry extends Entry = Entry, TFilter extends object = { }> implements StorageDriver<TEntry> {
    
    private _emitter: Emitter = new Emitter();
    private _entries: { [ key: string]: TEntry } = { };

    async fetch(id: string): Promise<TEntry|undefined> {

        const entry = this.get(id);
        return entry ? Promise.resolve({...entry}) : Promise.resolve(undefined);
    }

    async insert(input: TEntry): Promise<void> {

        this.rawInsert(input);
        return Promise.resolve();
    }

    async find(filter?: TFilter) : Promise<TEntry[]> {

        const entries = filter ? Object.values(this._entries).filter(entry => this.match(entry, filter)) : Object.values(this._entries);

        return Promise.resolve(entries.map(entry => {
            return {...entry};
        }));
    }

    async update(input: TEntry): Promise<void> {

        this.rawUpdate(input);
    }

    async delete(input: string | TEntry): Promise<void> {
        
        const id = typeof(input) === 'string' ? input : input.id;
        delete this._entries[id];
        this._emitter.trigger("remove", id);
    }

    async insertCollection(input: TEntry[]): Promise<void> {
        
        input.forEach(entry => this.rawInsert(entry));
    }

    async updateCollection(input: TEntry[]): Promise<void> {
        
        input.forEach(entry => this.rawUpdate(entry));
    }

    async deleteCollection(input: TEntry[]|string[]): Promise<void> {

        input.forEach(entry => this.delete(entry));
    }

    async dispose(): Promise<void> {
        this._entries = { }; 
    }

    handle(name: string, callback: EventHandler): EventHandlerUninstaller {
        return this._emitter.handle(name, callback);
    }

    on(name: string, callback: EventHandler): EmitterLike {
        this._emitter.on(name, callback);
        return this;
    }

    off(name: string, callback: EventHandler | null): EmitterLike {
        this._emitter.off(name, callback);
        return this;
    }

    protected match(entry: TEntry, filter: TFilter) : boolean {
        return true;
    }

    private get(id: string) : TEntry|undefined {
        return this._entries[id];
    }

    private rawInsert(input: TEntry) {
        this._entries[input.id] = {...input};
        
        this._emitter.trigger("update", input);
    }

    private rawUpdate(input: TEntry) {
        const entry = this.get(input.id);
        const payload = entry ? { ...entry, ...input } : { ...input };

        this._entries[input.id] = payload;
        this._emitter.trigger("update", payload);
    }
};
