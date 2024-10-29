import { Entry } from "./Entry";

export interface UpdateEventPayload<TEntry extends Entry = Entry> {
    entry: TEntry;
};