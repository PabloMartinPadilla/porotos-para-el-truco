const KEY = 'truco_historial';

export function saveRecord(record) {
    const list = getAll();
    list.unshift(record);
    localStorage.setItem(KEY, JSON.stringify(list));
}

export function getAll() {
    try {
        return JSON.parse(localStorage.getItem(KEY)) || [];
    } catch {
        return [];
    }
}

export function clearAll() {
    localStorage.removeItem(KEY);
}
