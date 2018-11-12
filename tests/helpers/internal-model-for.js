import { recordIdentifierFor } from 'ember-data/-private';

export default function internalModelFor(store, type, id) {
  let identifier = recordIdentifierFor(store, { type, id });
  return store._internalModelForIdentifier(identifier);
}
