import { Event } from "@pawel-kuznik/iventy";
import { DeleteEventPayload } from "./DeleteEventPayload";
import { Entry } from "./Entry";
import { MemoryDriver } from "./MemoryDriver";
import { UpdateEventPayload } from "./UpdateEventPayload";

describe("MemoryDriver", () => {

    interface Foo extends Entry {
        name: string
    };

    it("should persist data", async () => {

        const driver = new MemoryDriver<Foo>();
        await driver.insert({ id: "test", name: "foo" });
        const result = await driver.fetch("test");

        expect(result?.id).toEqual("test");
        expect(result?.name).toEqual("foo");
    });

    it("should delete data", async () => {

        const driver = new MemoryDriver<Foo>();
        await driver.insert({ id: "test", name: "foo" });
        await driver.delete("test");
        const result = await driver.fetch("test");

        expect(result).toEqual(undefined);
    });

    it("should expose an entry potential", async () => {

        const driver = new MemoryDriver<Foo>();
        await driver.insert({ id: "test", name: "foo" });
        const entryPotential = driver.getEntryPotential("test");

        const entry = await entryPotential.fetch();
        expect(entry?.id).toEqual("test");
        expect(entry?.name).toEqual("foo");
    });

    it("should expose an entry potential that reacts to changes", done => {

        const driver = new MemoryDriver<Foo>();
        const entryPotential = driver.getEntryPotential("test");

        entryPotential.on("update", (event: Event<UpdateEventPayload<Foo>>) => {

            const data = event.data.entry;

            expect(data.id).toEqual("test")
            expect(data.name).toEqual("foo");
            done();
        });

        driver.insert({ id: "wrong", name: "not-foo" });
        driver.insert({ id: "test", name: "foo" });
    });

    it("should expose an entry potential that reacts to removals", done => {

        
        const driver = new MemoryDriver<Foo>();
        const entryPotential = driver.getEntryPotential("test");

        entryPotential.on("delete", (event: Event<DeleteEventPayload<Foo>>) => {

            const id = event.data.entry.id;

            expect(id).toEqual("test");
            done();
        });

        driver.insert({ id: "wrong", name: "not-foo" }).then(() => driver.delete("wrong"));
        driver.insert({ id: "test", name: "foo" }).then(() => driver.delete("test"));
    });
});
