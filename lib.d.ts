export interface IComputation<T = any> {
  get(): T;
}

interface ISwitch {
  root<T>(fn: (dispose?: () => void) => T): T;
  run<T>(fn: () => T): IComputation<T>;
  run<T>(fn: (seed: T) => T, seed: T, comparer?: (previous: T, current: T) => boolean): IComputation<T>;
  track<T>(fn: () => T): IComputation<T>;
  track<T>(fn: (seed: T) => T, seed: T): IComputation<T>;
  on<T, U>(ev: IComputation<U>, fn: (result: U) => T): IComputation<T>;
  on<T, U>(ev: IComputation<U>, fn: (result: U, seed: T) => T, seed: T, track?: boolean, onchanges?: boolean, comparer?: (previous: T, current: T) => boolean): IComputation<T>;
  wrap<T, U>(node: IComputation<T>, selector: (node: T) => U): IComputation<U>;
  join<T extends Array<IComputation>>(array: T): IComputation<T extends Array<IComputation<infer U>> ? U[] : any>;
  frozen(): boolean;
  listening(): boolean;
  freeze<T>(fn: () => T): T;
  renew(node: IComputation): void;
  sample<T>(fn: IComputation<T>): T;
  dispose(node: IComputation): void;
  cleanup(fn: (final?: boolean) => void): void;
}

export declare const S: ISwitch;

export class Data<T> implements IComputation<T> {

  constructor(value: T);

  get(): T;
  set(value: T): T;
}

export class Value<T> extends Data<T> {

  constructor(value: T, comparer?: (current: T, next: T) => boolean);
}

export interface IEnumerable<T> extends IComputation<T[]> {
  readonly length: number;

  forEach(fn: (item: T, index: IComputation<number>) => void): void;
  map<U>(fn: (item: T, index: IComputation<number>) => U): IEnumerable<U>;
}

export class List<T> extends Data<T[]> implements IEnumerable<T> {
  readonly length: number;

  pop(): void;
  push(value: T): void;
  shift(): void;
  unshift(value: T): void;
  move(from: number, to: number): void;
  replace(index: number, value: T): void;
  insert(index: number, value: T): void;
  insertRange(index: number, values: T[]): void;
  remove(value: T): void;
  removeAt(index: number): void;
  removeRange(from: number, count: number): void;

  forEach(fn: (item: T, index: IComputation<number>) => void): void;
  map<U>(fn: (item: T, index: IComputation<number>) => U): IEnumerable<U>;
}

export class Observable<T> extends List<T> { }

export interface IPatcher<T,U> {
  onSetup(ln: number): void;
  onMutation(changes: number[]): void;
  onEnter(index: number): U;
  onMove(from: number, to: number, type: number): void;
  onExit(index: number): void;
  onUnresolved(cStart: number, cEnd: number, uStart: number, uEnd: number): void;
  onTeardown(): U[];
}

export class Patcher<T,U> implements IPatcher<T,U> {

  protected readonly _current: T[];
  protected readonly _updates: T[];
  protected readonly _mutation: (() => number[]) | undefined;
  protected readonly _source: IComputation<T[]>;
  protected readonly _factory: (item: T, index?: IComputation<number>) => U;
  protected readonly _indexed: boolean;
  protected readonly _disposers: ((final?: boolean) => void)[];
  protected readonly _tempDisposers: ((final?: boolean) => void)[];
  protected readonly _indices: { data: IComputation<number>, index: number }[];
  protected readonly _tempIndices: { data: IComputation<number>, index: number }[];

  constructor(factory: (item: T, index?: IComputation<number>) => U, mutation?: () => number[]);

  onSetup(ln: number): void;
  onMutation(changes: number[]): void;
  onEnter(index: number): U;
  onMove(from: number, to: number, direction?: number): void;
  onExit(index: number, final?: boolean): void;
  onUnresolved(cStart: number, cEnd: number, uStart: number, uEnd: number): void;
  onTeardown(): U[];
}

export class MapPatcher<T, U> extends Patcher<T, U> {
  protected readonly _mapped: U[];
  protected readonly _tempMapped: U[];
}

export function mount<T,U>(patcher: IPatcher<T,U>, source: IComputation<T>): IComputation<U[]>;
export function dismount<T,U>(patcher: IPatcher<T,U>): void;
export function reconcile<T,U>(patcher: IPatcher<T,U>, updates: T[]): U[];

