import { EntityConfigPopulator } from '@snowmonkey/plugin-base';
import { StoreConfig } from '@snowmonkey/store/src';

class RxDBEntityConfigPopulator implements EntityConfigPopulator<{ mango: Record<string, unknown> }> {
  populate(
    config: StoreConfig<{ mango: Record<string, unknown> }>,
    schema: string
  ): StoreConfig<{ mango: Record<string, unknown> }> {
    return {
      ...config,
      queries: {
        ...config.queries,
        [schema]: {
          ...(config.queries.schema || {}),
          findAll: {
            mango: () => ({})
          },
          findById: {
            mango: ({ id }: { id: string }) => ({ _id: id })
          },
          findBy: {
            mango: ({ key, value }: { key: string; value: unknown }) => ({ [key]: value })
          }
        }
      }
    };
  }
}

export function rxdbPopulator() {
  return new RxDBEntityConfigPopulator();
}
