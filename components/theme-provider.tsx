'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'warm' | 'light';

const ThemeContext = createContext<{
    theme: Theme;
    setTheme: (t: Theme) => void;
}>({ theme: 'warm', setTheme: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('warm');

    // Sync from localStorage on mount
    useEffect(() => {
        const saved = (localStorage.getItem('aicn-theme') as Theme) ?? 'warm';
        setThemeState(saved);
        document.documentElement.setAttribute('data-theme', saved);
    }, []);

    const setTheme = (t: Theme) => {
        setThemeState(t);
        localStorage.setItem('aicn-theme', t);
        document.documentElement.setAttribute('data-theme', t);
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
