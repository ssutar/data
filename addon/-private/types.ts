import { Value as JSONValue } from 'json-typescript';

export type TMeta = { [k: string]: JSONValue };
export type TDict<K extends string, V> = { [KK in K]: V };

export interface IResourceIdentifier {
  id: string | null;
  lid?: string;
  type: string;
  // json-api spec does not allow for `null` here
  //   but we do for allowing users to `reset` or
  //   otherwise `empty` their meta cache
  meta?: TMeta | null;
}

export interface IRecordIdentifier extends IResourceIdentifier {
  // we are more strict that ResourceIdentifier in that `lid` MUST be present
  lid: string;
  id: string | null;
  type: string;
  meta: TMeta | null;
}

export interface IDeprecatedResourceIdentifier extends IResourceIdentifier {
  clientId?: string;
}

export interface IDeprecatedRecordIdentifier extends IRecordIdentifier {
  clientId?: string;
  toString(): string;
}
