import { EmitterLike } from "@pawel-kuznik/iventy";
import { Entry } from "./Entry";

/**
 *  This is an interface describing how a storage driver should behave.
 *  The interface should be vague enough that variety of drivers can be
 *  implemented, but concrete enough that it can be used by the Sack class
 *  to fulfill all data needs. 
 */
export interface StorageDriver<TEntry extends Entry = Entry, TFilter extends object = { }> extends EmitterLike {

    /**
     *  Fetch a copy of the entry stored in the storage driver.
     */
    fetch(id: string) : Promise<TEntry|undefined>;

    /**
     *  Insert a new copy to the storage. If there is an entry with
     *  a matching id, then the entry will be replaced with the new
     *  one.
     */
    insert(input: TEntry): Promise<void>;

    /**
     *  Find a set of entries. 
     */
    find(filter?: TFilter) : Promise<TEntry[]>;
    
    /**
     *  Update an entry in the storage driver. The update should be
     *  performed by copying over the properties of the input over
     *  the stored data. If the storage driver doesn't contain an
     *  entry with matching id, a new entry based on the input will
     *  be inserted into the storage.
     */
    update(input: TEntry): Promise<void>;

    /**
     *  Remove an entry from the sack.
     */
    delete(input: TEntry|string): Promise<void>;

    /**
     *  Insert a collection of items.
     */
    insertCollection(input: TEntry[]) : Promise<void>;

    /**
     *  Update a collection of items.
     */
    updateCollection(input: TEntry[]) : Promise<void>;

    /**
     *  Remove a collection of items.
     */
    deleteCollection(input: TEntry[]|string[]) : Promise<void>;

    /**
     *  Dispose of any data or connection.
     */
    dispose() : Promise<void>;
};