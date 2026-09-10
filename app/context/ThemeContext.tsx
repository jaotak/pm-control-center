"use client";

import { createContext, useContext, useEffect, useState, startTransition } from "react";
import { saveTheme } from "@/app/actions/theme";

type Theme = "light" | "dark";

const ThemeContext = createContext<{
    theme: Theme;
    toggle: () => void;
}>({ theme: "light", toggle: () => {} });

export function ThemeProvider({
    children,
    initialTheme = "light",
}: {
    children: React.ReactNode;
    initialTheme?: Theme;
}) {
    const [theme, setTheme] = useState<Theme>(initialTheme);

    // On mount, prefer localStorage (instant) then fall back to server-provided initialTheme
    useEffect(() => {
        const stored = (localStorage.getItem("pm-theme") as Theme) || initialTheme;
        setTheme(stored);
        document.documentElement.setAttribute("data-theme", stored);
    }, [initialTheme]);

    const toggle = () => {
        const next: Theme = theme === "light" ? "dark" : "light";
        setTheme(next);
        
        localStorage.setItem("pm-theme", next);
        document.documentElement.setAttribute("data-theme", next);
        
        // Persist to DB (non-blocking)
        startTransition(() => {
            saveTheme(next);
        });
    };

    return (
        <ThemeContext.Provider value={{ theme, toggle }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
