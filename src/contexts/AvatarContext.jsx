import { createContext, useContext, useState, useCallback } from 'react';

const AvatarContext = createContext();

export function AvatarProvider({ children, sidebarStats }) {
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [updateTrigger, setUpdateTrigger] = useState(0);

    const updateAvatar = useCallback((newUrl) => {
        setAvatarUrl(newUrl);
        setUpdateTrigger(prev => prev + 1);
    }, []);

    return (
        <AvatarContext.Provider value={{
            avatarUrl,
            updateAvatar,
            updateTrigger,
            sidebarStats // ← AGREGAR
        }}>
            {children}
        </AvatarContext.Provider>
    );
}

export const useAvatar = () => {
    const context = useContext(AvatarContext);
    if (!context) {
        throw new Error('useAvatar must be used within AvatarProvider');
    }
    return context;
};