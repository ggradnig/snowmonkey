import { Queries, Store } from "@zinc/store";
import {
  bootstrapClient,
  bootstrapServer,
} from "../../packages/store/src/bootstrap";
import { createRxDBRepository } from "@zinc/plugin-rxdb";
import { addRxPlugin } from "rxdb";
import { differenceBy } from "lodash";
import { filter, first, map, timeout } from "rxjs/operators";
import { firstValueFrom, identity } from "rxjs";

addRxPlugin(require("pouchdb-adapter-memory"));
addRxPlugin(require("rxdb/plugins/server"));
addRxPlugin(require("pouchdb-adapter-http"));

const queries: Queries = {
  customers: {
    findById: {
      /** TODO: identity could be default **/
      mango: identity,
    },
    findAll: {
      mango: () => ({}),
    },
  },
};

const schema = {
  customers: {
    properties: {
      customerId: {
        type: "number",
      },
      name: {
        type: "string",
      },
      confirmed: {
        type: "boolean",
      },
    },
  },
} as const;

describe("CreateCustomer Integration Test", () => {
  let clientStore: Store;
  let serverStore: Store;

  beforeEach(async () => {
    clientStore = await bootstrapClient(
      {
        schema,
        queries,
        mutations: {
          addCustomer: (snapshot, customer) =>
            snapshot.insert("customers", customer),
        },
      },
      createRxDBRepository({
        name: "clientdb",
        adapter: "memory",
      }),
      "http://localhost:6943/db"
    );

    serverStore = await bootstrapServer(
      {
        schema,
        queries,
        mutations: {
          confirmCustomer: (mutator, { customerId, response }) =>
            mutator
              .query("customers.findById", { customerId })
              .reduce(([customer]) => {
                customer.confirmed = response.confirmed;
              }),
        },
        reactions: [
          {
            query: "customers.findAll",
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
      createRxDBRepository({
        name: "serverdb",
        adapter: "memory",
      }),
      {
        path: "/db",
        startServer: true,
        port: 6943,
        pouchdbExpressOptions: {
          inMemoryConfig: true,
        },
      }
    );
  });

  it("should confirm a new customer on the server", async () => {
    clientStore.mutate("addCustomer", {
      customerId: 123,
      name: "John Doe",
      confirmed: false,
    });

    const confirmed = await firstValueFrom(
      clientStore.query("customers.findById", { customerId: 123 }).pipe(
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
