import { Store } from "@zinc/store";
import { bootstrap } from "../../packages/store/src/bootstrap";
import { createRxDBRepository } from "@zinc/plugin-rxdb";
import { addRxPlugin } from "rxdb";
import { differenceBy } from "lodash";
import { filter, first, map, tap, timeout } from "rxjs/operators";
import { firstValueFrom } from "rxjs";

addRxPlugin(require("pouchdb-adapter-memory"));
addRxPlugin(require("rxdb/plugins/server"));
addRxPlugin(require("pouchdb-adapter-http"));

describe("CreateCustomer Integration Test", () => {
  let clientStore: Store;
  let serverStore: Store;

  const queries = {
    getCustomer: {
      mango: ({ customerId }) => ({
        collection: "customers",
        query: { customerId },
      }),
    },
    getCustomers: {
      mango: () => ({
        collection: "customers",
        query: {},
      }),
    },
  };

  beforeEach(async () => {
    clientStore = await bootstrap(
      {
        queries,
        mutations: {
          addCustomer: (snapshot, customer) =>
            snapshot.insert("customers", customer),
        },
      },
      createRxDBRepository(
        {
          name: "clientdb",
          adapter: "memory",
        },
        undefined,
        ["http://localhost:6943/db"]
      )
    );

    serverStore = await bootstrap(
      {
        queries,
        mutations: {
          confirmCustomer: (mutator, { customerId, response }) =>
            mutator
              .query("getCustomer", { customerId })
              .reduce(([customer]) => {
                customer.confirmed = response.confirmed;
              }),
        },
        reactions: [
          {
            query: "getCustomers",
            event: (p, c) =>
              differenceBy(c, p, (customer) => customer["customerId"])[0],
            resolve: (newCustomer) => Promise.resolve({ confirmed: true }),
            mutate: (event, response) => ({
              operation: "confirmCustomer",
              data: { customerId: event.customerId, response },
            }),
          },
        ],
      },
      createRxDBRepository(
        {
          name: "serverdb",
          adapter: "memory",
        },
        {
          path: "/db",
          startServer: true,
          port: 6943,
          pouchdbExpressOptions: {
            inMemoryConfig: true,
          },
        }
      )
    );
  });

  it("should confirm a new customer on the server", async () => {
    clientStore.mutate("addCustomer", {
      customerId: 123,
      name: "John Doe",
      confirmed: false,
    });

    const confirmed = await firstValueFrom(
      clientStore.query("getCustomer", { customerId: 123 }).pipe(
        map(([customer]) => customer.confirmed),
        filter(Boolean),
        first(),
        timeout(2500)
      )
    );

    expect(confirmed).toBe(true);
  });

  afterAll(async () => {
    await clientStore.teardown();
    await serverStore.teardown();
  });
});
