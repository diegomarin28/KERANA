import { createContext, useContext, useState, useCallback } from 'react';

const AvatarContext = createContext();

export function AvatarProvider({ children }) {
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [updateTrigger, setUpdateTrigger] = useState(0);

    const updateAvatar = useCallback((newUrl) => {
        setAvatarUrl(newUrl);
        setUpdateTrigger(prev => prev + 1);
    }, []);

    const refreshAvatar = useCallback(() => {
        setUpdateTrigger(prev => prev + 1);
    }, []);

    return (
        <AvatarContext.Provider value={{ avatarUrl, updateAvatar, refreshAvatar, updateTrigger }}>
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