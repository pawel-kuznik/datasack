import { EmitterLike } from "@pawel-kuznik/iventy";
import { Entry } from "./Entry";

/**
 *  This interface describes a potential for an entry. By that it means that
 *  the interface describes a way to fetch an entry or observe it.
 * 
 *  @event update   This event triggers when the entry updates.
 *  @event delete   This event triggers when the entry was removed. 
 */
export interface EntryPotential<TEntry extends Entry = Entry> extends EmitterLike {

    /**
     *  Fetch the actual entry.
     */
    fetch() : Promise<TEntry|undefined>;

    /**
     *  Update the entry with new data.
     */
    update(entry: TEntry) : Promise<void>;

    /**
     *  Detelet the entry.
     */
    delete() : Promise<void>;
};