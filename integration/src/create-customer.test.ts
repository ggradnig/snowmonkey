import { bootstrapClient, bootstrapServer, Store } from '@snowmonkey/store';
import { createRxDBRepository, rxdbPopulator } from '@snowmonkey/plugin-rxdb';
import { addRxPlugin } from 'rxdb';
import { differenceBy } from 'lodash';
import { filter, first, map, timeout } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import * as memoryAdapter from 'pouchdb-adapter-memory';
import * as serverPlugin from 'rxdb/plugins/server';
import * as httpAdapter from 'pouchdb-adapter-http';
import { model, property } from '@loopback/repository';
import { entityStoreConfig } from '@snowmonkey/entity';
import { register } from '@snowmonkey/plugin-loopback';

addRxPlugin(serverPlugin);
addRxPlugin(memoryAdapter);
addRxPlugin(httpAdapter);

@model({ name: 'customers' })
class Customer {
  @property()
  customerId: number;

  @property()
  name: string;

  @property()
  confirmed: boolean;
}

describe('CreateCustomer Integration Test', () => {
  let clientStore: Store;
  let serverStore: Store;

  beforeEach(async () => {
    clientStore = await bootstrapClient(
      await entityStoreConfig(register(Customer), rxdbPopulator()),
      createRxDBRepository({
        name: 'clientdb',
        adapter: 'memory'
      }),
      'http://localhost:6943/db'
    );

    serverStore = await bootstrapServer(
      await entityStoreConfig(register(Customer), rxdbPopulator(), {
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
      }),
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
    clientStore.mutate('customers.insert', {
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
