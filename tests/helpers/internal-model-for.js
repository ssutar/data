import { recordIdentifierFor } from 'ember-data/-private';

export default function internalModelFor(store, type, id) {
  let identifier = recordIdentifierFor(store, { type, id });
  return store._internalModelForIdentifier(identifier);
}

export function internalModelsFor(store, type) {
  return {
    get 0() {
      return store._internalModelsFor(type).models[0];
    },
    map(cb) {
      return store._internalModelsFor(type).models.map(cb);
    },
    filter(cb) {
      return store._internalModelsFor(type).models.filter(cb);
    },
    get length() {
      return store._internalModelsFor(type).models.length;
    },
  };
}
