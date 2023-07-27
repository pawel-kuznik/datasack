import { ConvertingDriver } from "./ConvertingDriver";
import { Entry } from "./Entry";
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

            expect(event.data instanceof Foo).toBeTruthy();
            expect(event.data.id).toEqual("test-1");
            expect(event.data.name).toEqual("name-1");

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

            expect(event.data.id).toEqual("test-1");

            done();
        });

        const instance = new Foo({ id: "test-1", name: "name-1" });

        driver.insert(instance).then(() => {
            driver.delete(instance);
        });
    });

});