import { useEffect } from 'react';

export function useTabBadge(count, baseTitle = 'Kerana') {
    useEffect(() => {
        // Actualizar título
        if (count > 0) {
            document.title = `(${count > 99 ? '99+' : count}) ${baseTitle}`;
        } else {
            document.title = baseTitle;
        }

        // Cleanup al desmontar
        return () => {
            document.title = baseTitle;
        };
    }, [count, baseTitle]);
}

export default useTabBadge;