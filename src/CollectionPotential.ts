import { EmitterLike } from "@pawel-kuznik/iventy";
import { Entry } from "./Entry";

/**
 *  This is an interface describing a potential collection that might be available
 *  in the future. This also extends to ability to listen to changes in this given
 *  potential collection.
 * 
 *  @note The potential here is needed cause we want to expose some control
 *  and information about a collection before we fetch or decide to fetch it.
 *  This interface describes such.
 * 
 *  @todo finish describing this interface.
 */
export interface CollectionPotential<TEntry extends Entry = Entry> extends EmitterLike {

    /**
     *  Get all entries loaded in the collection.
     */
    all() : Promise<TEntry[]>;
};
