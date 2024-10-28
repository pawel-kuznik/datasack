import { Entry } from "./Entry";
import { StorageDriver } from "./StorageDriver";
import { CollectionPotential } from "./CollectionPotential";
import { EntryPotential } from "./EntryPotential";
import { ConvertingEntryPotential } from "./ConvertingEntryPotential";
import { ConvertingCollectionPotential } from "./ConvertingCollectionPotential";
import { EntryCache } from "./EntryCache";

/**
 *  This is a driver that can wrap over another driver to convert
 *  between a user-space entry and a backend-specific data. Mainly,
 *  it is useful when dealing with classes in user space and with
 *  POJOs in the backend side.
 * 
 *  Note that creating instances of classes might be computationally
 *  expensive. If that's the case it's advised to pass a cache instance
 *  to the driver so that fetching instances of entries will not cause
 *  an additional instance construction.
 */
export abstract class ConvertingDriver<TEntry extends Entry = Entry, TData extends Entry = Entry, TFilter extends object = { }>
    implements StorageDriver<TEntry, TFilter>
{
    private _cache: EntryCache<TEntry> | undefined;
    private _storage: StorageDriver<TData, TFilter>;

    constructor(storage: StorageDriver<TData, TFilter>, cache: EntryCache<TEntry> | undefined = undefined) {
        this._storage = storage;
        this._cache = cache;
    }

    abstract wrap(input: TData) : Promise<TEntry>;
    abstract process(input: TEntry) : Promise<TData>;

    async fetch(id: string): Promise<TEntry | undefined> {

        if (this._cache) {

            const cached = this._cache.get(id);
            if (cached) return Promise.resolve(cached);
        }

        const data = await this._storage.fetch(id);
        if (data === undefined) return Promise.resolve(undefined);

        return this.wrap(data);
    }

    async insert(input: TEntry): Promise<void> {

        const data = await this.process(input);
        if (this._cache) this._cache.store(input);
        return this._storage.insert(data);
    }

    async find(filter?: TFilter | undefined): Promise<TEntry[]> {
        const result = await this._storage.find(filter);
        return Promise.all([ ...result.map(data => this.obtain(data)) ]);
    }

    async update(input: TEntry): Promise<void> {
        
        const data = await this.process(input)
        await this._storage.update(data);
        if (this._cache) this._cache.store(input);
    }

    async delete(input: string | TEntry): Promise<void> {
        
        const data = typeof(input) === 'string' ? input : await this.process(input);
        await this._storage.delete(data);
        if (this._cache) this._cache.invalidate(typeof(data) === 'string' ? data : data.id);
    }

    async insertCollection(input: TEntry[]): Promise<void> {
    
        const data = await Promise.all([...input.map(entry => this.process(entry))]);
        await this._storage.insertCollection(data);

        if (this._cache) {
            input.forEach(e => this._cache?.store(e));
        }
    }

    async updateCollection(input: TEntry[]): Promise<void> {
        
        const data = await Promise.all([...input.map(entry => this.process(entry))]);
        await this._storage.updateCollection(data);

        if (this._cache) {
            input.forEach(e => this._cache?.store(e));
        }
    }

    async deleteCollection(input: string[] | TEntry[]): Promise<void> {
        
        // nothing to remove?
        if (input.length === 0) return Promise.resolve();

        if (typeof(input[0] === 'string')) {   
            await this._storage.deleteCollection(input as string[]);
        }
        else {

            const data = await Promise.all((input as TEntry[]).map(value => this.process(value)));
            await this._storage.deleteCollection(data);
        }

        if (this._cache) {
            input.forEach(v => this._cache?.invalidate(typeof(v) === "string" ? v : v.id));
        }
    }

    /**
     *  Get a potential of an entry.
     */
    getEntryPotential(id: string): EntryPotential<TEntry> {
        
        const dataPotential = this._storage.getEntryPotential(id);
        return new ConvertingEntryPotential<TEntry, TData>(
            dataPotential,
            (data: TData) => this.obtain(data),
            (entry: TEntry) => this.process(entry)
        ); 
    }

    /**
     *  Get a potential of a collection of an entry.
     */
    getCollectionPotential(filter?: TFilter | undefined): CollectionPotential<TEntry> {
        
        const dataCollection = this._storage.getCollectionPotential(filter);
        return new ConvertingCollectionPotential<TEntry, TData>(
            dataCollection,
            (data: TData) => this.obtain(data),
            (entry: TEntry) => this.process(entry)
        );
    }

    async dispose(): Promise<void> {

        if (this._cache) this._cache.clear();

        // @todo should the converting driver dispose of the passed driver?
        return this._storage.dispose();
    }

    private obtain(input: TData) : Promise<TEntry> {

        if (this._cache) {
            const cached = this._cache.get(input.id);
            if (cached) return Promise.resolve(cached);
        }

        return this.wrap(input);
    }
};
