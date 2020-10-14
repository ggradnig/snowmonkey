import { bootstrapClient, bootstrapServer, Store } from '@zinc/store';
import { createRxDBRepository } from '@zinc/plugin-rxdb';
import { addRxPlugin } from 'rxdb';
import { differenceBy } from 'lodash';
import { filter, first, map, timeout } from 'rxjs/operators';
import { firstValueFrom, identity } from 'rxjs';
import * as memoryAdapter from 'pouchdb-adapter-memory';
import * as serverPlugin from 'rxdb/plugins/server';
import * as httpAdapter from 'pouchdb-adapter-http';

addRxPlugin(serverPlugin);
addRxPlugin(memoryAdapter);
addRxPlugin(httpAdapter);

interface Customer {
  customerId: number;
  name: string;
  confirmed: boolean;
}

const queries = {
  customers: {
    findById: {
      /** TODO: identity could be default **/
      mango: identity
    },
    findAll: {
      mango: () => ({})
    }
  }
};

const schema = {
  customers: {
    properties: {
      customerId: {
        type: 'number'
      },
      name: {
        type: 'string'
      },
      confirmed: {
        type: 'boolean'
      }
    }
  }
} as const;

describe('CreateCustomer Integration Test', () => {
  let clientStore: Store;
  let serverStore: Store;

  beforeEach(async () => {
    clientStore = await bootstrapClient(
      {
        schema,
        queries,
        mutations: {
          addCustomer: (snapshot, customer) => snapshot.insert('customers', customer)
        }
      },
      createRxDBRepository({
        name: 'clientdb',
        adapter: 'memory'
      }),
      'http://localhost:6943/db'
    );

    serverStore = await bootstrapServer(
      {
        schema,
        queries,
        mutations: {
          confirmCustomer: (mutator, { customerId, response }: { customerId: string; response: Customer }) =>
            mutator.query('customers.findById', { customerId }).reduce(([customer]) => {
              customer.confirmed = response.confirmed;
            })
        },
        reactions: [
          {
            query: 'customers.findAll',
            event: (p, c) => differenceBy(c, p, (customer) => customer['customerId'])[0],
            resolve: () => Promise.resolve({ confirmed: true }),
            mutate: (event, response) => ({
              operation: 'confirmCustomer',
              data: { customerId: event.customerId, response }
            })
          }
        ]
      },
      createRxDBRepository({
        name: 'serverdb',
        adapter: 'memory'
      }),
      {
        path: '/db',
        startServer: true,
        port: 6943,
        pouchdbExpressOptions: {
          inMemoryConfig: true
        }
      }
    );
  });

  it('should confirm a new customer on the server', async () => {
    clientStore.mutate('addCustomer', {
      customerId: 123,
      name: 'John Doe',
      confirmed: false
    });

    const confirmed = await firstValueFrom(
      clientStore.query('customers.findById', { customerId: 123 }).pipe(
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
