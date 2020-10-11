import { RxDBRepository } from "./rxdb-repository";
import { RepositoryFactory } from "@zinc/plugin-base";
import { RxDatabaseCreator, RxJsonSchema, ServerOptions } from "rxdb";
import { SchemaDefinition } from "../../plugin-base/src/types";
import { Servable, Syncable } from "@zinc/store";

export function createRxDBRepository(
  config: RxDatabaseCreator
): RepositoryFactory<Syncable<string> & Servable<ServerOptions>> {
  return new RxDBRepositoryFactory(config);
}

class RxDBRepositoryFactory
  implements RepositoryFactory<Syncable<string> & Servable<ServerOptions>> {
  private created = false;

  private schemas: SchemaDefinition;

  constructor(private config: RxDatabaseCreator) {}

  async create(): Promise<RxDBRepository> {
    // TODO: This code could be in a base class
    if (this.created) {
      throw Error(
        "Can only create one instance of RxDBRepository with a single factory"
      );
    }
    this.created = true;

    if (!this.schemas) {
      throw Error("RxDB requires a Schema Definition");
    }

    const repo = new RxDBRepository(this.config, mapSchemas(this.schemas));
    await repo.init();

    return repo;
  }

  setSchema(schemas: SchemaDefinition) {
    this.schemas = schemas;
  }
}

function mapSchemas(
  definition: SchemaDefinition
): { [key: string]: RxJsonSchema } {
  const rxJsonSchema = {};
  for (let [key, schema] of Object.entries(definition)) {
    rxJsonSchema[key] = {
      title: key,
      version: 0,
      type: "object",
      properties: schema.properties,
    };
  }
  return rxJsonSchema;
}
