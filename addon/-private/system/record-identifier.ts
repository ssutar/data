import Store from './store';
import coerceId from './coerce-id';
import { DEBUG } from '@glimmer/env';
import { TDict, IResourceIdentifier, IRecordIdentifier } from '../types';
import { assert } from '@ember/debug';

type TStore = InstanceType<typeof Store>;
type TmodelName = string;
type TclientId = string;
type Tid = string;

interface IKeyOptions {
  lid: TDict<TclientId, IRecordIdentifier>;
  id: TDict<Tid, IRecordIdentifier>;
}

type TTypeMap = TDict<TmodelName, IKeyOptions>;

let CLIENT_ID = 0;
let DEBUG_MAP;

if (DEBUG) {
  DEBUG_MAP = new WeakMap<IRecordIdentifier, IRecordIdentifier>();
}

function generateLid(): string {
  return `@ember-data:lid-${CLIENT_ID++}`;
}

const STORE_MAP = new WeakMap<TStore, TTypeMap>();

function makeRecordIdentifier(resourceIdentifier: IResourceIdentifier): IRecordIdentifier {
  let lid = coerceId(resourceIdentifier.lid);

  // TODO we may not want to fall back to ID if we want a global lookup of lid
  //   but if we maintain buckets scoped by type this is ok.
  //   polymorphism may be easier with non-scoped buckets and uniform lid
  lid = lid === null ? coerceId(resourceIdentifier.id) : lid;
  lid = lid === null ? generateLid() : lid;

  let recordIdentifier: IRecordIdentifier = {
    lid,
    id: coerceId(resourceIdentifier.id),
    type: resourceIdentifier.type,
    meta: resourceIdentifier.meta || null,
  };

  if (DEBUG) {
    // we enforce immutability in dev
    //  but preserve our ability to do controlled updates to the reference
    let wrapper: IRecordIdentifier = {
      get lid() {
        return recordIdentifier.lid;
      },
      get id() {
        return recordIdentifier.id;
      },
      get type() {
        return recordIdentifier.type;
      },
      get meta() {
        return recordIdentifier.meta;
      },
    };
    Object.freeze(wrapper);
    DEBUG_MAP.set(wrapper, recordIdentifier);
    return wrapper;
  }

  return recordIdentifier;
}

function performRecordIdentifierUpdate(
  identifier: IRecordIdentifier,
  { meta, type, id, lid }: IResourceIdentifier
) {
  if (DEBUG) {
    identifier = DEBUG_MAP.get(identifier);

    if (lid !== undefined) {
      let newLid = coerceId(lid);
      if (newLid !== identifier.lid) {
        throw new Error(
          `The 'lid' for a RecordIdentifier cannot be updated once it has been created. Attempted to set lid for '${
            identifier.type
          }:${identifier.id} (${identifier.lid})' to '${lid}'.`
        );
      }
    }

    if (id !== undefined) {
      let newId = coerceId(id);

      if (identifier.id !== null && identifier.id !== newId) {
        throw new Error(
          `The 'id' for a RecordIdentifier cannot be updated once it has been set. Attempted to set id for '${
            identifier.type
          }:${identifier.id} (${identifier.lid})' to '${newId}'.`
        );
      }
    }

    // TODO consider how to support both single and multi table polymorphism
    if (type !== identifier.type) {
      throw new Error(
        `The 'type' for a RecordIdentifier cannot be updated once it has been set. Attempted to set type for '${
          identifier.type
        }:${identifier.id} (${identifier.lid})' to '${type}'.`
      );
    }
  }

  if (id !== undefined) {
    identifier.id = coerceId(id);
  }

  if (meta) {
    Object.assign(identifier.meta, meta);
  } else if (meta === null) {
    identifier.meta = null;
  }
}

/**
 * EmberData supports multiple store instances. Each store
 *   has it's own unique RecordIdentifiers.
 *
 * This method Updates a RecordIdentifier for a given store
 *   with new information.
 *
 * - `id` (if `id` was previously `null`)
 * - `meta`
 * - `lid` and `type` MUST NOT be altered post creation
 *
 * @method updateRecordIdentifier
 * @param {Store} store - the Store instance to which this identifier belongs
 * @param {IRecordIdentifier} identifier - the identifier to update
 * @param {IResourceIdentifier} resourceIdentifier - new information for this identifier
 */
export function updateRecordIdentifier(
  store: TStore,
  identifier: IRecordIdentifier,
  resourceIdentifier: IResourceIdentifier
): void {
  if (DEBUG) {
    assert(
      `The passed identifier for ${identifier.type}:${identifier.id} (${
        identifier.lid
      }) does not belong to the given store instance.`,
      identifier === recordIdentifierFor(store, identifier)
    );

    let id = identifier.id;
    let newId = coerceId(resourceIdentifier.id);

    if (id !== null && id !== newId && newId !== null) {
      let keyOptions = getLookupBucket(store, identifier.type);
      let eid = keyOptions.id[newId];
      if (eid !== undefined) {
        throw new Error(
          `Attempted to update the 'id' for the RecordIdentifier '${identifier.type}:${id} (${
            identifier.lid
          })' to '${newId}', but that id is already in use by '${eid.type}:${eid.id} (${eid.lid})'`
        );
      }
    }
  }

  let id = identifier.id;
  performRecordIdentifierUpdate(identifier, resourceIdentifier);
  let newId = identifier.id;

  if (id !== newId && newId !== null) {
    let keyOptions = getLookupBucket(store, identifier.type);
    keyOptions.id[newId] = identifier;
  }
}

function getLookupBucket(store: TStore, type) {
  let typeMap: TTypeMap | undefined = STORE_MAP.get(store);

  if (typeMap === undefined) {
    typeMap = Object.create(null) as TTypeMap;
    STORE_MAP.set(store, typeMap);
  }

  let keyOptions: IKeyOptions = typeMap[type];
  if (keyOptions === undefined) {
    keyOptions = {
      lid: Object.create(null),
      id: Object.create(null),
    } as IKeyOptions;
    typeMap[type] = keyOptions;
  }

  return keyOptions;
}

function isNonEmptyString(str?: string | null): str is string {
  return typeof str === 'string' && str.length > 0;
}

export function recordIdentifierFor(
  store: TStore,
  resourceIdentifier: IResourceIdentifier
): IRecordIdentifier | null {
  let keyOptions = getLookupBucket(store, resourceIdentifier.type);
  let identifier: IRecordIdentifier | null = null;
  let lid = coerceId(resourceIdentifier.lid);
  let id = coerceId(resourceIdentifier.id);
  let hasLid = isNonEmptyString(lid);
  let hasId = isNonEmptyString(id);

  if (DEBUG) {
    if (!hasId && !hasLid) {
      throw new Error('Resource Identifiers must have either an `id` or an `lid` on them');
    }
  }

  if (hasLid) {
    identifier = keyOptions.lid[lid as string] || null;
  }

  if (identifier === null && hasId) {
    identifier = keyOptions.id[id as string] || null;
  }

  if (identifier === null && (hasId || hasLid)) {
    identifier = makeRecordIdentifier(resourceIdentifier);
    keyOptions.lid[identifier.lid] = identifier;

    if (hasId) {
      keyOptions.id[id as string] = identifier;
    }
  }

  return identifier || null;
}
