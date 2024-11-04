import { v4 as uuid } from "uuid";
import { Entry } from "./Entry";
import { StorageDriver } from "./StorageDriver";
import { EntryPotential } from "./EntryPotential";
import { CollectionPotential } from "./CollectionPotential";
import { isEqual } from "lodash";

/**
 *  This is a class representing a certain group of data. The elements in the group should
 *  be objects.
 */
export class Sack<TEntry extends Entry = Entry, TFilter extends object = {}> {

    private _storage: StorageDriver<TEntry>;

    private _entryPotentials: Map<string, EntryPotential<TEntry>> = new Map();
    private _collectionPotentials: Array<[TFilter|undefined, CollectionPotential<TEntry>]> = [];

    constructor(driver: StorageDriver<TEntry>) {
        this._storage = driver;
    }
      
    /**
     *  Prepare a new entry. This entry will not be automatically stored, but it will
     *  be ready to be used.
     */
    async prepare() : Promise<TEntry> {
        return Promise.resolve({ id: uuid() } as TEntry);
    }

    /**
     *  Create a new entry in the sack. The entry will be stored before returned.
     */
    async create() : Promise<TEntry> {

        const payload = await this.prepare();
        await this.store(payload, { mode: "replace" });

        return payload;
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
     *  Find entries matching a specific filter or all items as they are.
     */
    async find(filter?: TFilter) : Promise<TEntry[]> {

        return this._storage.find(filter);
    }

    /**
     *  Update or insert an entry.
     */
    async upsert(input: TEntry|TEntry[]) : Promise<void> {

        return this.store(input, { mode: "update" });
    }

    /**
     *  Insert an entry.
     */
    async insert(input: TEntry|TEntry[]) : Promise<void> {

        this.store(input, { mode: "replace" });
    }

    /**
     *  Store a specific entry or a collection of entries.
     */
    async store(input: TEntry|TEntry[], options: { mode: "replace" | "update" } = { mode: "replace" }) : Promise<void> {

        if (Array.isArray(input)) {

            if (options.mode === 'replace') return this._storage.insertCollection(input);
            return this._storage.updateCollection(input);
        }

        else {
            if (options.mode === 'replace') return this._storage.insert(input);
            return this._storage.update(input);
        }
    }

    /**
     *  Delete a specific entry.
     */
    async delete(input: TEntry|TEntry[]|string|string[]) {

        if (Array.isArray(input)) return this._storage.deleteCollection(input);
        else this._storage.delete(input);
    }

    /**
     *  Get a potential of a specific entry. The returned instance is stable. Meaning,
     *  subsequent calls to this method with the same ID will yield the same potential
     *  instance.
     */
    getEntryPotential(id: string) : EntryPotential<TEntry> {

        // try to first find a cached potential.
        const cached = this._entryPotentials.get(id);
        if (cached) return cached;

        // create a new potential and remember it in cache
        const potential = this._storage.getEntryPotential(id); 
        this._entryPotentials.set(id, potential);

        return potential; 
    }

    /**
     *  Get a potential of a specific collection. The returned instance is stable. Meaning,
     *  subsequent calls to this method with equal filter will yield the same potential
     *  instance.
     */
    getCollectionPotential(filter?: TFilter) : CollectionPotential<TEntry> {

        // first try to find a cached collection potential that matches the passed filter
        const cached = this._collectionPotentials.find(r => isEqual(r[0], filter));
        if (cached) return cached[1];

        // create a new potential and store it in the cache.
        const potential = this._storage.getCollectionPotential(filter);
        this._collectionPotentials.push([ filter, potential ]);

        return potential;
    }
};
