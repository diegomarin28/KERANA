// components/NotificationProvider.jsx
import { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications debe ser usado dentro de NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const addNotification = useCallback((notification) => {
        const id = Date.now() + Math.random();
        const newNotification = {
            id,
            type: 'info',
            duration: 5000,
            ...notification,
        };

        setNotifications(prev => [...prev, newNotification]);

        if (newNotification.duration !== 0) {
            setTimeout(() => {
                removeNotification(id);
            }, newNotification.duration);
        }

        return id;
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);

    const value = {
        notifications,
        addNotification,
        removeNotification,
        clearAll,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
            <NotificationContainer />
        </NotificationContext.Provider>
    );
};

const NotificationContainer = () => {
    const { notifications, removeNotification } = useNotifications();

    if (notifications.length === 0) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 20,
                right: 20,
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                maxWidth: 400,
            }}
        >
            {notifications.map((notification) => (
                <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClose={() => removeNotification(notification.id)}
                />
            ))}
        </div>
    );
};

const NotificationItem = ({ notification, onClose }) => {
    const getStyles = (type) => {
        const baseStyle = {
            padding: '12px 16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '12px',
            maxWidth: '400px',
            animation: 'slideInRight 0.3s ease-out',
        };

        const typeStyles = {
            success: {
                backgroundColor: '#d1fae5',
                border: '1px solid #10b981',
                color: '#065f46',
            },
            error: {
                backgroundColor: '#fee2e2',
                border: '1px solid #ef4444',
                color: '#7f1d1d',
            },
            warning: {
                backgroundColor: '#fef3c7',
                border: '1px solid #f59e0b',
                color: '#78350f',
            },
            info: {
                backgroundColor: '#dbeafe',
                border: '1px solid #3b82f6',
                color: '#1e3a8a',
            },
        };

        return { ...baseStyle, ...typeStyles[type] };
    };

    return (
        <div style={getStyles(notification.type)}>
            <div style={{ flex: 1 }}>
                {notification.title && (
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                        {notification.title}
                    </div>
                )}
                <div>{notification.message}</div>
            </div>
            <button
                onClick={onClose}
                style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '18px',
                    cursor: 'pointer',
                    padding: 0,
                    color: 'inherit',
                    opacity: 0.7,
                }}
            >
                ×
            </button>
        </div>
    );
};