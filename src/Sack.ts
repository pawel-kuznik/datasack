import { Entry } from "./Entry";
import { StorageDriver } from "./StorageDriver";

/**
 *  This is a class representing a certain group of data. The elements in the group should
 *  be objects.
 */
export class Sack<TEntry extends Entry = Entry> {

    private _storage: StorageDriver<TEntry>;

    constructor(driver: StorageDriver<TEntry>) {
        this._storage = driver;
    }

    /**
     *  Prepare a new entry. This entry will not be automatically stored, but it will
     *  be ready to be used.
     */
    async prepare() : Promise<TEntry> {
        return Promise.resolve({ id: 'test' } as TEntry);
    }

    /**
     *  Fetch an entry based on id.
     */
    async fetch(id: string) : Promise<TEntry> {

        const entry = await this._storage.fetch(id);
        if (!entry) throw Error(`Entry with id: ${id} not found`);

        return entry;
    }

    /**
     *  Store a specific entry.
     */
    async store(input: TEntry, options: { mode: "replace" | "update" } = { mode: "replace" }) : Promise<void> {

        if (options.mode === 'replace') return this._storage.insert(input);
        return this._storage.update(input);
    }
};