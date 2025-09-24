import { useEffect, useState } from "react";

const KEY = "recent_searches_v1";
const MAX = 8;

export default function useRecentSearches() {
    const [items, setItems] = useState([]);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(KEY);
            if (raw) setItems(JSON.parse(raw));
        } catch {}
    }, []);

    const persist = (arr) => {
        localStorage.setItem(KEY, JSON.stringify(arr));
        setItems(arr);
    };

    const add = (q) => {
        if (!q || !q.trim()) return;
        const t = q.trim();
        const next = [t, ...items.filter(i => i.toLowerCase() !== t.toLowerCase())].slice(0, MAX);
        persist(next);
    };

    const remove = (q) => persist(items.filter(i => i !== q));
    const clear = () => persist([]);

    return { items, add, remove, clear };
}
