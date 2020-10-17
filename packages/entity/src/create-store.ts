import { EntityConfigPopulator, EntityRegistry } from '@snowmonkey/plugin-base';
import { StoreConfig } from '@snowmonkey/store';

export async function entityStoreConfig<Q>(
  registry: EntityRegistry,
  populator: EntityConfigPopulator<Q>,
  additionalConfig?: Partial<StoreConfig<Q>>
): Promise<StoreConfig<Q>> {
  const schemas = await registry.getSchemas();
  return Object.keys(schemas).reduce((p, c) => populator.populate(p, c), {
    schema: { ...schemas, ...(additionalConfig?.schema || {}) },
    queries: additionalConfig?.queries ?? {},
    mutations: Object.keys(schemas).reduce(
      (p, c) => ({
        ...p,
        [`${c}.insert`]: (mutator, data) => mutator.insert(c, data)
      }),
      additionalConfig?.mutations ?? {}
    ),
    reactions: additionalConfig?.reactions ?? []
  });
}
