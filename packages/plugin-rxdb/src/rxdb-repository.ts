import { Document, Repository } from "@zinc/plugin-base";
import { Observable } from "rxjs";
import {
  createRxDatabase,
  isRxDocument,
  MangoQueryNoLimit,
  RxDatabase,
  RxDatabaseCreator,
  RxDocument,
  RxJsonSchema,
  ServerOptions,
} from "rxdb";
import { groupBy } from "lodash";
import { map } from "rxjs/operators";
import { Servable, Syncable } from "@zinc/store";

export class RxDBRepository
  implements
    Repository<MangoQueryNoLimit>,
    Syncable<string>,
    Servable<ServerOptions> {
  readonly syntax = "mango";

  private db: RxDatabase;

  constructor(
    private creator: RxDatabaseCreator,
    private schemas: { [key: string]: RxJsonSchema }
  ) {}

  async init() {
    this.db = await createRxDatabase(this.creator);
    for (let [key, schema] of Object.entries(this.schemas)) {
      await this.db.collection({
        name: key,
        schema,
      });
    }
  }

  find(query: MangoQueryNoLimit, schema: string): Observable<object[]> {
    if (!schema) {
      throw new Error("RxDB does not support queries without a schema");
    }

    return this.db.collections[schema]
      .find({ selector: query })
      .$.pipe(map((docs) => docs.map((doc) => doc.toJSON())));
  }

  async purge(object: Document) {
    throw Error("Purging is not implemented in RxDB");
  }

  async upsert(...documents: Document[]) {
    const self = this;
    await Promise.all(documents.map(upsertOne));

    async function upsertOne(document: Document) {
      if (isRxDocument(document.data)) {
        // await (document.data as RxDocument).save();
      } else {
        // customers => document.destination
        await self.db.collections["customers"].upsert(document.data);
      }
    }
  }

  async insert(...documents: Document[]) {
    const self = this;
    await Promise.all(
      Object.entries(
        groupBy(documents, (document) => document.destination)
      ).map(insertDestination)
    );

    async function insertDestination([destination, documents]: [
      string,
      Document[]
    ]) {
      const collection = await self.db.collections[destination];
      if (documents.length > 1) {
        await collection.bulkInsert(documents.map((doc) => doc.data));
      } else {
        await collection.insert(documents[0].data);
      }
    }
  }

  async update(...documents: Document[]) {
    await Promise.all(documents.map(updateOne));

    async function updateOne(document: Document) {
      if (isRxDocument(document.data)) {
        await (document.data as RxDocument).save();
      }
    }
  }

  async teardown() {
    await this.db.destroy();
  }

  async serve(config: ServerOptions) {
    await this.db.server(config);
  }

  async sync(remote: string) {
    for (let [name, collection] of Object.entries(this.db.collections)) {
      collection.sync({
        remote: `${remote}/${name}`,
        options: {
          live: true,
          retry: true,
        },
      });
    }
  }
}
