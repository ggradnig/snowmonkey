import { JSONSchema7 } from 'json-schema';
import { Schemas, StoreConfig } from '@snowmonkey/store/src';

export interface EntityRegistry {
  getSchemas(): Promise<Schemas>;
}

export interface EntityConfigPopulator<Q> {
  populate(config: StoreConfig<Q>, schema: string): StoreConfig<Q>;
}
