import { ConvertingDriver } from "./ConvertingDriver";
import { Entry } from "./Entry";
import { EntryCache } from "./EntryCache";
import { MemoryDriver } from "./MemoryDriver";

describe('ConvertingDriver', () => {

    interface FooData extends Entry {
        name: string;
    }

    class Foo implements Entry {

        private _name: string;
        private _id: string;

        get id() : string { return this._id; }
        get name() : string { return this._name; }

        constructor(input: FooData) {

            this._name = input.name;
            this._id = input.id;
        }

        toJSON() {
            return {
                id: this.id,
                name: this._name
            };
        }
    };

    class FooDriver extends ConvertingDriver<Foo, FooData> {
        wrap(input: FooData): Promise<Foo> {
            return Promise.resolve(new Foo(input));
        }
        process(input: Foo): Promise<FooData> {
            return Promise.resolve(input.toJSON());
        }
    };

    it('should store entry', async () => {

        const impl = new MemoryDriver<FooData>();
        const driver = new FooDriver(impl);

        const instance = new Foo({ id: "test-1", name: "name-1" });

        await driver.insert(instance);

        const data = await impl.fetch("test-1");
        expect(data?.id).toEqual("test-1");
        expect(data?.name).toEqual("name-1");
        
        const fetched = await driver.fetch("test-1");

        expect(fetched instanceof Foo).toBeTruthy();
        expect(fetched?.id).toEqual("test-1");
        expect(fetched?.name).toEqual("name-1");
    });

    it('entry potential should trigger on update', done => {

        const impl = new MemoryDriver<FooData>();
        const driver = new FooDriver(impl);

        const entryPotential = driver.getEntryPotential("test-1");

        entryPotential.on('update', event => {

            const entry = event.data.entry;

            expect(entry instanceof Foo).toBeTruthy();
            expect(entry.id).toEqual("test-1");
            expect(entry.name).toEqual("name-1");

            done();
        });

        const instance = new Foo({ id: "test-1", name: "name-1" });

        driver.insert(instance);
    });

    it('entry potential should trigger delete event with id', done => {

        const impl = new MemoryDriver<FooData>();
        const driver = new FooDriver(impl);

        const entryPotential = driver.getEntryPotential("test-1");

        entryPotential.on('delete', event => {

            expect(event.data.entry.id).toEqual("test-1");

            done();
        });

        const instance = new Foo({ id: "test-1", name: "name-1" });

        driver.insert(instance).then(() => {
            driver.delete(instance);
        });
    });

    it('collection potential should trigger an update event', done => {

        const impl = new MemoryDriver<FooData>();
        const driver = new FooDriver(impl);

        const collectionPotential = driver.getCollectionPotential();

        collectionPotential.on('update', event => {

            const entry = event.data.entry;

            expect(entry instanceof Foo).toBeTruthy();
            expect(entry.id).toEqual("test-1");
            expect(entry.name).toEqual("name-1");

            done();
        });

        const instance = new Foo({ id: "test-1", name: "name-1" });

        driver.insert(instance);
    });

    it('collection potential should trigger an update event only for matching entry', done => {

        const impl = new MemoryDriver<FooData>();
        const driver = new FooDriver(impl);

        const collectionPotential = driver.getCollectionPotential({ name: "name-1" });

        collectionPotential.on('update', event => {

            const entry = event.data.entry;

            expect(entry instanceof Foo).toBeTruthy();
            expect(entry.id).toEqual("test-1");
            expect(entry.name).toEqual("name-1");

            done();
        });

        const wrong = new Foo({ id: "test-0", name: "wrong-name" });
        const instance = new Foo({ id: "test-1", name: "name-1" });

        driver.insert(wrong).then(() => {
            driver.insert(instance);
        });
    });

    it('entry potential should trigger delete event with id', done => {

        const impl = new MemoryDriver<FooData>();
        const driver = new FooDriver(impl);

        const collectionPotential = driver.getCollectionPotential();

        collectionPotential.on('delete', event => {

            expect(event.data.entry.id).toEqual("test-1");

            done();
        });

        const instance = new Foo({ id: "test-1", name: "name-1" });

        driver.insert(instance).then(() => {
            driver.delete(instance);
        });
    });

    it('should create new entities when no cache is specified', async () => {

        // @note
        // Don't use .toBe(), .toEqual(), or .toStrictEqual(). jest is making super
        // confusing to compare objects that should be the same. For some reason .toEqual
        // is not really equal but deep equal, toBe is not really Object.is but falls
        // back on string conversion equality, and toStrictEqual does the deep equal again.
        // Why??  

        const impl = new MemoryDriver<FooData>();
        const driver = new FooDriver(impl);

        const foo = new Foo({ id: 'test-1', name: "name-1" });

        await driver.insert(foo);

        const fetched = await driver.fetch('test-1');

        expect(foo.id).toEqual(fetched?.id);
        expect(foo === fetched).not.toEqual(true);
    });

    it('should use the cached entity', async () => {

        // @note
        // Don't use .toBe(), .toEqual(), or .toStrictEqual(). jest is making super
        // confusing to compare objects that should be the same. For some reason .toEqual
        // is not really equal but deep equal, toBe is not really Object.is but falls
        // back on string conversion equality, and toStrictEqual does the deep equal again.
        // Why??  

        const cache = new EntryCache<Foo>();
        const impl = new MemoryDriver<FooData>();
        const driver = new FooDriver(impl, cache);

        const foo1 = new Foo({ id: 'test-1', name: "name-1" });
        const foo2 = new Foo({ id: 'test-2', name: "name-2" });

        await driver.insert(foo1);
        await driver.insert(foo2);
        
        const fetched1 = await driver.fetch('test-1');
        
        const newFoo2 = new Foo({ id: 'test-2', name: "name-2" });
        await driver.update(newFoo2);

        const fetched2 = await driver.fetch('test-2');

        expect(foo1.id).toEqual(fetched1?.id);
        expect(foo1 == fetched1).toEqual(true);

        expect(newFoo2.id).toEqual(fetched2?.id);
        expect(newFoo2 == fetched2).toEqual(true);

        await driver.delete('test-1');

        const afterDeleteFoo1 = await driver.fetch('test-1');
        expect(afterDeleteFoo1).toEqual(undefined);
    });

    it('should use the cached entity (collection operations)', async () => {

        // @note
        // Don't use .toBe(), .toEqual(), or .toStrictEqual(). jest is making super
        // confusing to compare objects that should be the same. For some reason .toEqual
        // is not really equal but deep equal, toBe is not really Object.is but falls
        // back on string conversion equality, and toStrictEqual does the deep equal again.
        // Why??  

        const cache = new EntryCache<Foo>();
        const impl = new MemoryDriver<FooData>();
        const driver = new FooDriver(impl, cache);

        const foo1 = new Foo({ id: 'test-1', name: "name-1" });
        const foo2 = new Foo({ id: 'test-2', name: "name-2" });

        const collection = [ foo1, foo2 ];

        await driver.insertCollection(collection);
        
        const fetched1 = await driver.fetch('test-1');
        
        const newFoo2 = new Foo({ id: 'test-2', name: "name-2" });
        await driver.updateCollection([ newFoo2 ]);

        const fetched2 = await driver.fetch('test-2');

        expect(foo1.id).toEqual(fetched1?.id);
        expect(foo1 == fetched1).toEqual(true);

        expect(newFoo2.id).toEqual(fetched2?.id);
        expect(newFoo2 == fetched2).toEqual(true);

        await driver.deleteCollection([ foo1]);

        const afterDeleteFoo1 = await driver.fetch('test-1');
        expect(afterDeleteFoo1).toEqual(undefined);
    });

    it('should use the cached entity (potentials)', async () => {

        // @note
        // Don't use .toBe(), .toEqual(), or .toStrictEqual(). jest is making super
        // confusing to compare objects that should be the same. For some reason .toEqual
        // is not really equal but deep equal, toBe is not really Object.is but falls
        // back on string conversion equality, and toStrictEqual does the deep equal again.
        // Why??  

        const cache = new EntryCache<Foo>();
        const impl = new MemoryDriver<FooData>();
        const driver = new FooDriver(impl, cache);

        const foo1 = new Foo({ id: 'test-1', name: "name-1" });
        const foo2 = new Foo({ id: 'test-2', name: "name-2" });

        const collection = [ foo1, foo2 ];

        await driver.insertCollection(collection);
        
        const collectionPotential = driver.getCollectionPotential();

        const fetchedCollection = await collectionPotential.all();
        const fetched1 = fetchedCollection.find(v => v.id === "test-1");

        expect(foo1.id).toEqual(fetched1?.id);
        expect(foo1 == fetched1).toEqual(true);

        const foo1Potential = driver.getEntryPotential('test-1');
        const singlarFoo1Fetched = await foo1Potential.fetch();

        expect(foo1.id).toEqual(singlarFoo1Fetched?.id);
        expect(foo1 == singlarFoo1Fetched).toEqual(true);
    });
});