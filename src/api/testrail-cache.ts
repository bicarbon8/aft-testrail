export module TestRailCache {
    var storage: Map<string, string> = new Map<string, string>();

    export function has(key: string): boolean {
        return storage.has(key);
    }

    export function get(key: string): string {
        return storage.get(key);
    }

    export function set(key: string, val: string): void {
        storage.set(key, val);
    }

    export function clear() {
        storage.clear();
    }
}