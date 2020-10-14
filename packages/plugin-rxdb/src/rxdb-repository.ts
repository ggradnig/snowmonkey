import { Repository } from '@zinc/plugin-base';
import { Observable } from 'rxjs';
import {
  createRxDatabase,
  isRxDocument,
  MangoQueryNoLimit,
  RxDatabase,
  RxDatabaseCreator,
  RxDocument,
  RxJsonSchema,
  ServerOptions
} from 'rxdb';
import { map } from 'rxjs/operators';
import { Servable, Syncable } from '@zinc/store';

export class RxDBRepository implements Repository<MangoQueryNoLimit>, Syncable<string>, Servable<ServerOptions> {
  readonly syntax = 'mango';

  private db: RxDatabase;

  constructor(private creator: RxDatabaseCreator, private schemas: { [key: string]: RxJsonSchema }) {}

  async init(): Promise<void> {
    this.db = await createRxDatabase(this.creator);
    for (const [key, schema] of Object.entries(this.schemas)) {
      await this.db.collection({
        name: key,
        schema
      });
    }
  }

  find<T extends Record<string, unknown>>(query: Record<string, unknown>, schema: string): Observable<T[]> {
    if (!schema) {
      throw new Error('RxDB does not support queries without a schema');
    }

    return this.db.collections[schema].find({ selector: query }).$.pipe(map((docs) => docs.map((doc) => doc.toJSON())));
  }

  async purge(): Promise<void> {
    throw Error('Purging is not implemented in RxDB');
  }

  async upsert(schema: string, ...records: Record<string, unknown>[]): Promise<void> {
    const self = this;
    await Promise.all(records.map(upsertOne));

    async function upsertOne(document: Record<string, unknown>) {
      await self.db.collections[schema].upsert(document);
    }
  }

  async insert(schema: string, ...records: Record<string, unknown>[]): Promise<void> {
    const self = this;
    const collection = await self.db.collections[schema];
    if (records.length > 1) {
      await collection.bulkInsert(records);
    } else {
      await collection.insert(records[0]);
    }
  }

  async update(schema: string, ...records: Record<string, unknown>[]): Promise<void> {
    await Promise.all(records.map(updateOne));

    async function updateOne(document: Record<string, unknown>) {
      if (isRxDocument(document.data)) {
        await ((document.data as unknown) as RxDocument).save();
      }
    }
  }

  async teardown(): Promise<void> {
    await this.db.destroy();
  }

  async serve(config: ServerOptions): Promise<void> {
    await this.db.server(config);
  }

  async sync(remote: string): Promise<void> {
    for (const [name, collection] of Object.entries(this.db.collections)) {
      collection.sync({
        remote: `${remote}/${name}`,
        options: {
          live: true,
          retry: true
        }
      });
    }
  }
}
