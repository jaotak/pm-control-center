"use client";

import { createContext, useContext, useState, ReactNode, useCallback, useMemo } from "react";

interface SidebarContextType {
    isOpen: boolean;
    toggleSidebar: () => void;
    closeSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    const toggleSidebar = useCallback(() => {
        setIsOpen(prev => !prev);
    }, []);

    const closeSidebar = useCallback(() => {
        setIsOpen(prev => (prev ? false : prev));
    }, []);

    const value = useMemo(
        () => ({ isOpen, toggleSidebar, closeSidebar }),
        [isOpen, toggleSidebar, closeSidebar]
    );

    return (
        <SidebarContext.Provider value={value}>
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    const context = useContext(SidebarContext);
    if (context === undefined) {
        throw new Error("useSidebar must be used within a SidebarProvider");
    }
    return context;
}
