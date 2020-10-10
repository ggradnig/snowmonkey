import { Repository } from "../../plugin-base";
import { Store, StoreConfig } from "./types";
import { Store as StoreClass } from "./store";

export async function bootstrap<S, R>(
  storeConfig: StoreConfig<S>,
  repository: Promise<Repository<R>>
): Promise<Store> {
  return new StoreClass(storeConfig, await repository);
}
