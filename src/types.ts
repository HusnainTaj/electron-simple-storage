export type StoreConfig<T> = {
    filename: string;
    key: string;
    fallback: T;
};