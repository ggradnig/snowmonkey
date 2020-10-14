import { Observable } from 'rxjs';
import { JSONSchema7 } from 'json-schema';

export interface Document {
  destination: string;
  data: Record<string, unknown>;
}

export interface Repository<Q> {
  readonly syntax: string;

  teardown(): Promise<void>;

  find<T extends Record<string, unknown>>(query: Q, schema: string): Observable<T[]>;

  insert(schema: string, ...records: Record<string, unknown>[]): Promise<void>;

  update(schema: string, ...records: Record<string, unknown>[]): Promise<void>;

  upsert(schema: string, ...records: Record<string, unknown>[]): Promise<void>;

  purge(object: Document): Promise<void>;
}

export type SchemaDefinition = { [key: string]: JSONSchema7 };

export interface RepositoryFactory<Q, T> {
  setSchema(schemas: SchemaDefinition);

  create(): Promise<Repository<Q> & T>;
}
