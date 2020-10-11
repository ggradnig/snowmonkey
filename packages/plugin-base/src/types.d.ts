import { Observable } from "rxjs";
import {JSONSchema7} from "json-schema";

export interface Change {}

export interface Upstream {
  send(change: Change);
}

export interface Downstream {
  receive$: Observable<Change>;
}

export interface Cache {
  get(gql: string): Promise<object>;

  set(gql: string, data: object): Promise<void>;
}

export interface Document {
  destination: string;
  data: object;
}

export interface Repository<Q> {
  readonly syntax: string;

  teardown(): Promise<void>;

  find(query: Q, schema: string): Observable<object[]>;

  insert(...documents: Document[]): Promise<void>;

  update(...documents: Document[]): Promise<void>;

  upsert(...documents: Document[]): Promise<void>;

  purge(object: Document): Promise<void>;
}

export type SchemaDefinition =  { [key: string]: JSONSchema7 };

export interface RepositoryFactory<T> {
  setSchema(schemas: SchemaDefinition);
  create(): Promise<Repository<any> & T>;
}
