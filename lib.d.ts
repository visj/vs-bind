export interface IComputation<T = any> {
  get(): T;
}

interface S {
  /**
   * @param fn The root lives until dispose is called, 
   * or forever if callback does not provide an argument for dispose.
   */
  root<T>(fn: (dispose?: () => void) => T): T;
  run<T>(fn: () => T): IComputation<T>;
  run<T>(fn: (seed: T) => T, seed: T): IComputation<T>;
  track<T>(fn: () => T): IComputation<T>;
  track<T>(fn: (seed: T) => T, seed: T): IComputation<T>;
  on<T, U>(ev: IComputation<U> | (() => U), fn: (result: U) => T): IComputation<T>;
  on<T, U>(ev: IComputation<U> | (() => U), fn: (result: U, seed: T) => T, seed: T, onchanges?: boolean): IComputation<T>;
  bind<T>(ev: IComputation | IComputation[] | (() => any), fn: (seed?: T) => T, onchanges?: boolean): (seed?: T) => T;
  frozen(): boolean;
  listening(): boolean;
  /**
   * Escape current listener, allowing inner root computations to respond 
   * to owner's changes. This is only useful if a computation creates 
   * root children that depend on the same source as the computation itself, which
   * allows created roots to respond to changes in the same tick as their 
   * @param fn 
   */
  escape<T>(fn: () => T): T;
  freeze<T>(fn: () => T): T;
  sample<T>(fn: () => T): T;
  dispose(node: IComputation): void;
  cleanup(fn: (final?: boolean) => void): void;
}

export declare const S: S;

export class Data<T> implements IComputation<T> {

  constructor(value: T);

  get(): T;
  set(value: T): T;
}

export class Value<T> extends Data<T> {

  constructor(value: T, comparer?: (x: T, y: T) => boolean);
}

export interface IEnumerable<T> extends IComputation<T[]> {
  forEach(fn: (item: T, index: IComputation<number>) => void): void;
  map<U>(fn: (item: T, index?: IComputation<number>) => U): IEnumerable<U>;
}

export class List<T> extends Data<T[]> {
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

export abstract class Patcher<T> {

  protected _current: T[];
  protected _updates: T[];
  protected readonly _mutation: (() => number[]) | undefined;

  protected constructor(mutation?: () => number[]);

  update(updates: T[]): void;
  onCleanup(): void;
  onSetup(ln: number): void;
  onTeardown(): void;
  onMutation(changes: number[]): void;
  abstract onEnter(index: number): void;
  abstract onMove(from: number, to: number, type: number): void;
  abstract onExit(index: number): void;
  abstract onUnresolved(cStart: number, cEnd: number, uStart: number, uEnd: number): void;
}

export class ListPatcher<T, U> extends Patcher<T> {

  protected readonly _source: IComputation<T[]>;
  protected readonly _factory: (item: T, index?: IComputation<number>) => U;
  protected readonly _indexed: boolean;
  protected _disposers: ((final?: boolean) => void)[];
  protected _tempDisposers: ((final?: boolean) => void)[];
  protected _indices: { data: IComputation<number>, index: number }[];
  protected _tempIndices: { data: IComputation<number>, index: number }[];

  constructor(source: IComputation<T[]>, fn: (item: T, index?: IComputation<number>) => U, mutation?: () => number[]);
  enter(item: T, index: number, i?: IComputation<number>): void;
  onEnter(index: number): void;
  onMove(from: number, to: number, type: number): void;
  onExit(index: number): void;
  onUnresolved(cStart: number, cEnd: number, uStart: number, uEnd: number): void;
}

export class MapPatcher<T, U> extends ListPatcher<T, U> {
  protected _mapped: U[];
  protected _tempMapped: U[];
}

