import { Document, Repository } from "@zinc/plugin-base";
import { Observable } from "rxjs";
import {
  createRxDatabase,
  isRxDocument,
  MangoQueryNoLimit,
  RxDatabase,
  RxDatabaseCreator,
  RxDocument,
  ServerOptions,
} from "rxdb";
import { groupBy } from "lodash";
import { map } from "rxjs/operators";

const customerSchema = {
  title: "customer",
  version: 0,
  description: "describes a customer",
  type: "object",
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
};

export class RxDBRepository
  implements Repository<{ collection: string; query: MangoQueryNoLimit }> {
  readonly syntax = "mango";

  private db: RxDatabase;

  constructor(
    private creator: RxDatabaseCreator,
    private server?: ServerOptions,
    private remotes?: string[]
  ) {}

  async init() {
    this.db = await createRxDatabase(this.creator);
    const collection = await this.db.collection({
      name: "customers",
      schema: customerSchema,
    });
    if (this.server) {
      await this.db.server(this.server);
    }
    if (this.remotes) {
      collection.sync({
        remote: this.remotes[0] + "/customers",
        options: {
          live: true,
          retry: true,
        },
      });
    }
  }

  find(query: { collection: string; query: object }): Observable<object[]> {
    return this.db.collections[query.collection]
      .find({ selector: query.query })
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
        await self.db.collections['customers'].upsert(
          document.data
        );
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
}
