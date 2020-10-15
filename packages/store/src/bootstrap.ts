import { Store, StoreConfig } from './types';
import { Store as StoreClass } from './store';
import { RepositoryFactory, Syncable, Servable } from '@snowmonkey/plugin-base';

export async function bootstrapStandalone<Q, S, R>(
  storeConfig: StoreConfig<Q, S>,
  repositoryFactory: RepositoryFactory<Q, R>
): Promise<Store> {
  repositoryFactory.setSchema(storeConfig.schema);
  const repository = await repositoryFactory.create();
  return new StoreClass(storeConfig, repository);
}

export async function bootstrapClient<Q, S, R>(
  storeConfig: StoreConfig<Q, S>,
  repositoryFactory: RepositoryFactory<Q, Syncable<R>>,
  ...remotes: R[]
): Promise<Store> {
  repositoryFactory.setSchema(storeConfig.schema);
  const repository = await repositoryFactory.create();
  remotes.forEach((remote) => repository.sync(remote));
  return new StoreClass(storeConfig, repository);
}

export async function bootstrapServer<Q, S, SC>(
  storeConfig: StoreConfig<Q, S>,
  repositoryFactory: RepositoryFactory<Q, Servable<SC>>,
  serverConfig: SC
): Promise<Store> {
  repositoryFactory.setSchema(storeConfig.schema);
  const repository = await repositoryFactory.create();
  await repository.serve(serverConfig);
  return new StoreClass(storeConfig, repository);
}
