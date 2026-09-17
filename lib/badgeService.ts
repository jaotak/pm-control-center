// Centralized badge service with deduplication and caching for Sidebar & NotificationBell
import { Notification } from "@prisma/client";

export interface BadgeData {
    unreadNotificationsCount: number;
    unreadNotifications: Notification[];
    unreadChatCount: number;
    pendingApprovalsCount: number;
}

type Listener = (data: BadgeData) => void;

let cachedData: BadgeData | null = null;
let lastFetchTime = 0;
let inflightPromise: Promise<BadgeData | null> | null = null;
const listeners = new Set<Listener>();

export function getCachedBadgeData(): BadgeData | null {
    return cachedData;
}

export function subscribeBadgeUpdates(listener: Listener): () => void {
    listeners.add(listener);
    if (cachedData) {
        listener(cachedData);
    }
    return () => {
        listeners.delete(listener);
    };
}

export function updateBadgeCache(partial: Partial<BadgeData>) {
    if (!cachedData) {
        cachedData = {
            unreadNotificationsCount: 0,
            unreadNotifications: [],
            unreadChatCount: 0,
            pendingApprovalsCount: 0,
            ...partial,
        };
    } else {
        cachedData = { ...cachedData, ...partial };
    }
    listeners.forEach((fn) => {
        try {
            fn(cachedData!);
        } catch { }
    });
}

export function clearChatUnreadCount() {
    updateBadgeCache({ unreadChatCount: 0 });
}

export async function fetchBadges(force = false): Promise<BadgeData | null> {
    if (typeof window === "undefined" || (typeof document !== "undefined" && document.hidden)) {
        return cachedData;
    }

    const now = Date.now();
    // Cache for 20 seconds unless forced
    if (!force && cachedData && now - lastFetchTime < 20000) {
        return cachedData;
    }

    if (inflightPromise) {
        return inflightPromise;
    }

    inflightPromise = (async () => {
        try {
            const res = await fetch("/api/user/badges");
            if (!res.ok) return cachedData;
            const data: BadgeData = await res.json();
            cachedData = data;
            lastFetchTime = Date.now();
            listeners.forEach((fn) => {
                try {
                    fn(data);
                } catch { }
            });
            return data;
        } catch {
            return cachedData;
        } finally {
            inflightPromise = null;
        }
    })();

    return inflightPromise;
}
