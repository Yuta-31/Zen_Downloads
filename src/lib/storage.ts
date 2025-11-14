export const getSync = async <T extends object> (defaults: T): Promise<T> => {
    return (await chrome.storage.sync.get(defaults)) as T;
}

export const setSync = async (values: object): Promise<void> => {
    await chrome.storage.sync.set(values)
}