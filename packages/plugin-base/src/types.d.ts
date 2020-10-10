import { Observable } from "rxjs";

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

  init(): Promise<void>;

  teardown(): Promise<void>;

  find(query: Q): Observable<object[]>;

  insert(...documents: Document[]): Promise<void>;

  update(...documents: Document[]): Promise<void>;

  upsert(...documents: Document[]): Promise<void>;

  purge(object: Document): Promise<void>;
}
