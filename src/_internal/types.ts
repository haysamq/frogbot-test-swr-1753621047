import type { SWRGlobalConfig } from '../index'
import type * as revalidateEvents from './events'

export type GlobalState = [
  Record<string, RevalidateCallback[]>, // EVENT_REVALIDATORS
  Record<string, [number, number]>, // MUTATION: [ts, end_ts]
  Record<string, [any, number]>, // FETCH: [data, ts]
  Record<string, FetcherResponse<any>>, // PRELOAD
  ScopedMutator, // Mutator
  (key: string, value: any, prev: any) => void, // Setter
  (key: string, callback: (current: any, prev: any) => void) => () => void // Subscriber
]
export type FetcherResponse<Data = unknown> = Data | Promise<Data>
export type BareFetcher<Data = unknown> = (
  ...args: any[]
) => FetcherResponse<Data>
export type Fetcher<
  Data = unknown,
  SWRKey extends Key = Key
> = SWRKey extends () => infer Arg | null | undefined | false
  ? (arg: Arg) => FetcherResponse<Data>
  : SWRKey extends null | undefined | false
  ? never
  : SWRKey extends infer Arg
  ? (arg: Arg) => FetcherResponse<Data>
  : never

export type ReactUsePromise<T = unknown, Error = unknown> = Promise<any> & {
  status?: 'pending' | 'fulfilled' | 'rejected'
  value?: T
  reason?: Error
}

export type BlockingData<
  Data = any,
  Options = SWROptions<Data>
> = SWRGlobalConfig extends { suspense: true }
  ? true
  : Options extends undefined
  ? false
  : Options extends { suspense: true }
  ? true
  : Options extends { fallbackData: Data | Promise<Data> }
  ? true
  : false

// Configuration types that are only used internally, not exposed to the user.
export interface InternalConfiguration {
  cache: Cache
  mutate: ScopedMutator
}

/**
 * @link https://swr.vercel.app/docs/options
 */
export interface PublicConfiguration<
  Data = any,
  Error = any,
  Fn extends Fetcher = BareFetcher
> {
  /**
   *  error retry interval in milliseconds
   *  @defaultValue 5000
   */
  errorRetryInterval: number
  /** max error retry count */
  errorRetryCount?: number
  /**
   * timeout to trigger the onLoadingSlow event in milliseconds
   * @defaultValue 3000
   */
  loadingTimeout: number
  /**
   * only revalidate once during a time span in milliseconds
   * @defaultValue 5000
   */
  focusThrottleInterval: number
  /**
   * dedupe requests with the same key in this time span in milliseconds
   * @defaultValue 2000
   */
  dedupingInterval: number
  /**
   *  @link https://swr.vercel.app/docs/revalidation
   *  * Disabled by default: `refreshInterval = 0`
   *  * If set to a number, polling interval in milliseconds
   *  * If set to a function, the function will receive the latest data and should return the interval in milliseconds
   */
  refreshInterval?: number | ((latestData: Data | undefined) => number)
  /**
   * polling when the window is invisible (if `refreshInterval` is enabled)
   * @defaultValue false
   *
   */
  refreshWhenHidden?: boolean
  /**
   * polling when the browser is offline (determined by `navigator.onLine`)
   */
  refreshWhenOffline?: boolean
  /**
   * automatically revalidate when window gets focused
   * @defaultValue true
   * @link https://swr.vercel.app/docs/revalidation
   */
  revalidateOnFocus: boolean
  /**
   * automatically revalidate when the browser regains a network connection (via `navigator.onLine`)
   * @defaultValue true
   * @link https://swr.vercel.app/docs/revalidation
   */
  revalidateOnReconnect: boolean
  /**
   * enable or disable automatic revalidation when component is mounted
   */
  revalidateOnMount?: boolean
  /**
   * automatically revalidate even if there is stale data
   * @defaultValue true
   * @link https://swr.vercel.app/docs/revalidation#disable-automatic-revalidations
   */
  revalidateIfStale: boolean
  /**
   * retry when fetcher has an error
   * @defaultValue true
   */
  shouldRetryOnError: boolean | ((err: Error) => boolean)
  /**
   * keep the previous result when key is changed but data is not ready
   * @defaultValue false
   */
  keepPreviousData?: boolean
  /**
   * @experimental  enable React Suspense mode
   * @defaultValue false
   * @link https://swr.vercel.app/docs/suspense
   */
  suspense?: boolean
  /**
   * initial data to be returned (note: ***This is per-hook***)
   * @link https://swr.vercel.app/docs/with-nextjs
   */
  fallbackData?: Data | Promise<Data>
  /**
   * the fetcher function
   */
  fetcher?: Fn
  /**
   * array of middleware functions
   * @link https://swr.vercel.app/docs/middleware
   */
  use?: Middleware[]
  /**
   * a key-value object of multiple fallback data
   * @link https://swr.vercel.app/docs/with-nextjs#pre-rendering-with-default-data
   */
  fallback: { [key: string]: any }
  /**
   * function to detect whether pause revalidations, will ignore fetched data and errors when it returns true. Returns false by default.
   */
  isPaused: () => boolean
  /**
   * callback function when a request takes too long to load (see `loadingTimeout`)
   */
  onLoadingSlow: (
    key: string,
    config: Readonly<PublicConfiguration<Data, Error, Fn>>
  ) => void
  /**
   * callback function when a request finishes successfully
   */
  onSuccess: (
    data: Data,
    key: string,
    config: Readonly<PublicConfiguration<Data, Error, Fn>>
  ) => void
  /**
   * callback function when a request returns an error
   */
  onError: (
    err: Error,
    key: string,
    config: Readonly<PublicConfiguration<Data, Error, Fn>>
  ) => void
  /**
   * handler for error retry
   */
  onErrorRetry: (
    err: Error,
    key: string,
    config: Readonly<PublicConfiguration<Data, Error, Fn>>,
    revalidate: Revalidator,
    revalidateOpts: Required<RevalidatorOptions>
  ) => void
  /**
   * callback function when a request is ignored due to race conditions
   */
  onDiscarded: (key: string) => void
  /**
   * comparison function used to detect when returned data has changed, to avoid spurious rerenders. By default, [stable-hash](https://github.com/shuding/stable-hash) is used.
   */
  compare: (a: Data | undefined, b: Data | undefined) => boolean
  /**
   * isOnline and isVisible are functions that return a boolean, to determine if the application is "active". By default, SWR will bail out a revalidation if these conditions are not met.
   * @link https://swr.vercel.app/docs/advanced/react-native#customize-focus-and-reconnect-events
   */
  isOnline: () => boolean
  /**
   * isOnline and isVisible are functions that return a boolean, to determine if the application is "active". By default, SWR will bail out a revalidation if these conditions are not met.
   * @link https://swr.vercel.app/docs/advanced/react-native#customize-focus-and-reconnect-events
   */
  isVisible: () => boolean
}

export type FullConfiguration<
  Data = any,
  Error = any,
  Fn extends Fetcher = BareFetcher
> = InternalConfiguration & PublicConfiguration<Data, Error, Fn>

export type ProviderConfiguration = {
  initFocus: (callback: () => void) => (() => void) | void
  initReconnect: (callback: () => void) => (() => void) | void
}
/**
 * @example
 * ```ts
 * const { data, error } = useSWR(key, fetcher)
 * ```
 */
export interface SWRHook {
  <Data = any, Error = any, SWRKey extends Key = StrictKey>(
    key: SWRKey
  ): SWRResponse<Data, Error>
  <Data = any, Error = any, SWRKey extends Key = StrictKey>(
    key: SWRKey,
    fetcher: Fetcher<Data, SWRKey> | null
  ): SWRResponse<Data, Error>
  <Data = any, Error = any, SWRKey extends Key = Key>(
    key: SWRKey,
    fetcher: Fetcher<Data, SWRKey> | null
  ): SWRResponse<Data, Error>
  <
    Data = any,
    Error = any,
    SWRKey extends Key = StrictKey,
    SWROptions extends
      | SWRConfiguration<Data, Error, Fetcher<Data, SWRKey>>
      | undefined =
      | SWRConfiguration<Data, Error, Fetcher<Data, SWRKey>>
      | undefined
  >(
    key: SWRKey
  ): SWRResponse<Data, Error, SWROptions>
  <
    Data = any,
    Error = any,
    SWRKey extends Key = StrictKey,
    SWROptions extends
      | SWRConfiguration<Data, Error, Fetcher<Data, SWRKey>>
      | undefined =
      | SWRConfiguration<Data, Error, Fetcher<Data, SWRKey>>
      | undefined
  >(
    key: SWRKey,
    fetcher: Fetcher<Data, SWRKey> | null
  ): SWRResponse<Data, Error, SWROptions>
  <
    Data = any,
    Error = any,
    SWRKey extends Key = StrictKey,
    SWROptions extends
      | SWRConfiguration<Data, Error, Fetcher<Data, SWRKey>>
      | undefined =
      | SWRConfiguration<Data, Error, Fetcher<Data, SWRKey>>
      | undefined
  >(
    key: SWRKey,
    config: SWRConfigurationWithOptionalFallback<SWROptions>
  ): SWRResponse<Data, Error, SWROptions>
  <
    Data = any,
    Error = any,
    SWRKey extends Key = StrictKey,
    SWROptions extends
      | SWRConfiguration<Data, Error, Fetcher<Data, SWRKey>>
      | undefined =
      | SWRConfiguration<Data, Error, Fetcher<Data, SWRKey>>
      | undefined
  >(
    key: SWRKey,
    fetcher: Fetcher<Data, SWRKey> | null,
    config: SWRConfigurationWithOptionalFallback<SWROptions>
  ): SWRResponse<Data, Error, SWROptions>
  <Data = any, Error = any>(key: Key): SWRResponse<Data, Error>
  <
    Data = any,
    Error = any,
    SWROptions extends
      | SWRConfiguration<Data, Error, BareFetcher<Data>>
      | undefined = SWRConfiguration<Data, Error, BareFetcher<Data>> | undefined
  >(
    key: Key
  ): SWRResponse<Data, Error, SWROptions>
  <
    Data = any,
    Error = any,
    SWROptions extends
      | SWRConfiguration<Data, Error, BareFetcher<Data>>
      | undefined = SWRConfiguration<Data, Error, BareFetcher<Data>> | undefined
  >(
    key: Key,
    fetcher: BareFetcher<Data> | null
  ): SWRResponse<Data, Error, SWROptions>
  <
    Data = any,
    Error = any,
    SWROptions extends
      | SWRConfiguration<Data, Error, BareFetcher<Data>>
      | undefined = SWRConfiguration<Data, Error, BareFetcher<Data>> | undefined
  >(
    key: Key,
    config: SWRConfigurationWithOptionalFallback<SWROptions>
  ): SWRResponse<Data, Error, SWROptions>
  <
    Data = any,
    Error = any,
    SWROptions extends
      | SWRConfiguration<Data, Error, BareFetcher<Data>>
      | undefined = SWRConfiguration<Data, Error, BareFetcher<Data>> | undefined
  >(
    key: Key,
    fetcher: BareFetcher<Data> | null,
    config: SWRConfigurationWithOptionalFallback<SWROptions>
  ): SWRResponse<Data, Error, SWROptions>
}

// Middleware guarantees that a SWRHook receives a key, fetcher, and config as the argument
export type Middleware = (
  useSWRNext: SWRHook
) => <Data = any, Error = any>(
  key: Key,
  fetcher: BareFetcher<Data> | null,
  config: SWRConfiguration<Data, Error, BareFetcher<Data>>
) => SWRResponse<Data, Error>

type ArgumentsTuple = readonly [any, ...unknown[]]
export type Arguments =
  | string
  | ArgumentsTuple
  | Record<any, any>
  | null
  | undefined
  | false
export type Key = Arguments | (() => Arguments)
export type StrictTupleKey = ArgumentsTuple | null | undefined | false
type StrictKey = StrictTupleKey | (() => StrictTupleKey)
export type MutatorCallback<Data = any> = (
  currentData?: Data
) => Promise<undefined | Data> | undefined | Data

/**
 * @typeParam Data - The type of the data related to the key
 * @typeParam MutationData - The type of the data returned by the mutator
 */
export type MutatorOptions<Data = any, MutationData = Data> = {
  revalidate?: boolean | ((data: Data, key: Arguments) => boolean)
  populateCache?:
    | boolean
    | ((result: MutationData, currentData: Data | undefined) => Data)
  optimisticData?:
    | Data
    | ((currentData: Data | undefined, displayedData: Data | undefined) => Data)
  rollbackOnError?: boolean | ((error: unknown) => boolean)
  throwOnError?: boolean
}

export type MutatorConfig = {
  revalidate?: boolean
  populateCache?: boolean
}

export type Broadcaster<Data = any, Error = any> = (
  cache: Cache<Data>,
  key: string,
  data: Data,
  error?: Error,
  isValidating?: boolean,
  revalidate?: boolean,
  populateCache?: boolean
) => Promise<Data>

export type State<Data = any, Error = any> = {
  data?: Data
  error?: Error
  isValidating?: boolean
  isLoading?: boolean
}

export type MutatorFn<Data = any> = (
  cache: Cache,
  key: Key,
  data?: Data | Promise<Data> | MutatorCallback<Data>,
  opts?: boolean | MutatorOptions<Data>
) => Promise<Data | undefined>

export type MutatorWrapper<Fn> = Fn extends (
  ...args: [...infer Parameters]
) => infer Result
  ? Parameters[3] extends boolean
    ? Result
    : Parameters[3] extends Required<Pick<MutatorOptions, 'populateCache'>>
    ? Parameters[3]['populateCache'] extends false
      ? never
      : Result
    : Result
  : never

export type Mutator<Data = any> = MutatorWrapper<MutatorFn<Data>>

export interface ScopedMutator {
  /**
   * @typeParam Data - The type of the data related to the key
   * @typeParam MutationData - The type of the data returned by the mutator
   */
  <Data = any, MutationData = Data>(
    matcher: (key?: Arguments) => boolean,
    data?: MutationData | Promise<MutationData> | MutatorCallback<MutationData>,
    opts?: boolean | MutatorOptions<Data, MutationData>
  ): Promise<Array<MutationData | undefined>>
  /**
   * @typeParam Data - The type of the data related to the key
   * @typeParam MutationData - The type of the data returned by the mutator
   */
  <Data = any, T = Data>(
    key: Arguments,
    data?: T | Promise<T> | MutatorCallback<T>,
    opts?: boolean | MutatorOptions<Data, T>
  ): Promise<T | undefined>
}

/**
 * @typeParam Data - The type of the data related to the key
 * @typeParam MutationData - The type of the data returned by the mutator
 */
export type KeyedMutator<Data> = <MutationData = Data>(
  data?: Data | Promise<Data | undefined> | MutatorCallback<Data>,
  opts?: boolean | MutatorOptions<Data, MutationData>
) => Promise<Data | MutationData | undefined>

export type SWRConfiguration<
  Data = any,
  Error = any,
  Fn extends BareFetcher<any> = BareFetcher<any>
> = Partial<PublicConfiguration<Data, Error, Fn>> &
  Partial<ProviderConfiguration> & {
    provider?: (cache: Readonly<Cache>) => Cache
  }

export type IsLoadingResponse<
  Data = any,
  Options = SWROptions<Data>
> = SWRGlobalConfig extends { suspense: true }
  ? Options extends { suspense: true }
    ? false
    : false
  : boolean

type SWROptions<Data> = SWRConfiguration<Data, Error, Fetcher<Data, Key>>
type SWRConfigurationWithOptionalFallback<Options> =
  // If `Options` has `fallbackData`, this turns it to optional instead.
  Options extends SWRConfiguration &
    Required<Pick<SWRConfiguration, 'fallbackData'>>
    ? Omit<Options, 'fallbackData'> & Pick<Partial<Options>, 'fallbackData'>
    : Options

export interface SWRResponse<Data = any, Error = any, Config = any> {
  /**
   * The returned data of the fetcher function.
   */
  data: BlockingData<Data, Config> extends true ? Data : Data | undefined
  /**
   * The error object thrown by the fetcher function.
   */
  error: Error | undefined
  mutate: KeyedMutator<Data>
  isValidating: boolean
  isLoading: IsLoadingResponse<Data, Config>
}

export type KeyLoader<Args extends Arguments = Arguments> =
  | ((index: number, previousPageData: any | null) => Args)
  | null

export interface RevalidatorOptions {
  retryCount?: number
  dedupe?: boolean
}

export type Revalidator = (
  revalidateOpts?: RevalidatorOptions
) => Promise<boolean> | void

export type RevalidateEvent =
  | typeof revalidateEvents.FOCUS_EVENT
  | typeof revalidateEvents.RECONNECT_EVENT
  | typeof revalidateEvents.MUTATE_EVENT
  | typeof revalidateEvents.ERROR_REVALIDATE_EVENT
type RevalidateCallbackReturnType = {
  [revalidateEvents.FOCUS_EVENT]: void
  [revalidateEvents.RECONNECT_EVENT]: void
  [revalidateEvents.MUTATE_EVENT]: Promise<boolean>
  [revalidateEvents.ERROR_REVALIDATE_EVENT]: void
}
export type RevalidateCallback = <K extends RevalidateEvent>(
  type: K,
  opts?: any
) => RevalidateCallbackReturnType[K]

export interface Cache<Data = any> {
  keys(): IterableIterator<string>
  get<T = Data>(key: string): State<T> | undefined
  set<T = Data>(key: string, value: State<T>): void
  delete(key: string): void
}

export interface StateDependencies {
  data?: boolean
  error?: boolean
  isValidating?: boolean
  isLoading?: boolean
}
