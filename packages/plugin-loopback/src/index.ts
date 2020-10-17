import { EntityRegistry } from '@snowmonkey/plugin-base';
import { getJsonSchema } from '@loopback/repository-json-schema';
import { Schemas } from '@snowmonkey/store';
import { buildModelDefinition } from '@loopback/repository';

class LoopbackEntityRegistry implements EntityRegistry {
  // eslint-disable-next-line @typescript-eslint/ban-types
  constructor(private types: (Function & { prototype: unknown })[]) {}

  async getSchemas(): Promise<Schemas> {
    const schemas: Schemas = {};
    for (const type of this.types) {
      schemas[buildModelDefinition(type).name] = getJsonSchema(type);
    }
    return schemas;
  }
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function register(...types: (Function & { prototype: unknown })[]): EntityRegistry {
  return new LoopbackEntityRegistry(types);
}
