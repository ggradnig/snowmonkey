import {Repository, RepositoryFactory} from "../../plugin-base";
import { Servable, Store, StoreConfig, Syncable } from "./types";
import { Store as StoreClass } from "./store";

export async function bootstrapStandalone<S, Q>(
  storeConfig: StoreConfig<S>,
  repositoryFactory: RepositoryFactory<any>
): Promise<Store> {
  repositoryFactory.setSchema(storeConfig.schema);
  const repository = await repositoryFactory.create();
  return new StoreClass(storeConfig, repository);
}

export async function bootstrapClient<S, R>(
  storeConfig: StoreConfig<S>,
  repositoryFactory: RepositoryFactory<Syncable<R>>,
  ...remotes: R[]
): Promise<Store> {
  repositoryFactory.setSchema(storeConfig.schema);
  const repository = await repositoryFactory.create();
  remotes.forEach((remote) => repository.sync(remote));
  return new StoreClass(storeConfig, repository);
}

export async function bootstrapServer<S, SC>(
  storeConfig: StoreConfig<S>,
  repositoryFactory: RepositoryFactory<Servable<SC>>,
  serverConfig: SC
): Promise<Store> {
  repositoryFactory.setSchema(storeConfig.schema);
  const repository = await repositoryFactory.create();
  await repository.serve(serverConfig);
  return new StoreClass(storeConfig, repository);
}
