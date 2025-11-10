import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { creditsAPI } from '../api/database';

export function useTopMensual() {
    const [showModal, setShowModal] = useState(false);
    const [topData, setTopData] = useState(null);
    const [userPosition, setUserPosition] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAndShowTopMensual();
    }, []);

    const checkAndShowTopMensual = async () => {
        try {
            // Mes anterior (el que se premia)
            const hoy = new Date();
            const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
            const mes = mesAnterior.getMonth() + 1;
            const año = mesAnterior.getFullYear();

            // ✅ Verificar si ya lo vio este mes ACTUAL (no el anterior)
            const mesActual = hoy.getMonth() + 1;
            const añoActual = hoy.getFullYear();
            const storageKey = `top_mensual_visto_${mesActual}_${añoActual}`;
            const yaVisto = localStorage.getItem(storageKey);

            if (yaVisto) {
                console.log('✅ Ya viste el top este mes');
                setLoading(false);
                return;
            }

            // ✅ Obtener top del mes ANTERIOR
            console.log(`📊 Buscando top de ${mes}/${año}...`);
            const { data: topExistente, error: topError } = await creditsAPI.getTopMensual(mes, año);

            if (topError) {
                console.error('❌ Error obteniendo top:', topError);
                setLoading(false);
                return;
            }

            // ✅ Si existe, mostrar
            if (topExistente && topExistente.length > 0) {
                console.log('✅ Top encontrado, mostrando modal');
                await showTopModal(topExistente, mes, año, storageKey);
            } else {
                console.log('⚠️ No hay top del mes anterior');
                setLoading(false);
            }

        } catch (error) {
            console.error('❌ Error en checkAndShowTopMensual:', error);
            setLoading(false);
        }
    };

    const showTopModal = async (topData, mes, año, storageKey) => {
        // Verificar si el usuario actual está en el top
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: userData } = await supabase
                .from('usuario')
                .select('id_usuario')
                .eq('auth_id', user.id)
                .single();

            if (userData) {
                const posicion = topData.find(t => t.autor_id === userData.id_usuario);
                setUserPosition(posicion || null);
            }
        }

        setTopData({ rankings: topData, mes, año });
        setShowModal(true);

        // ✅ Marcar como visto ESTE MES (para que no aparezca más hasta el próximo mes)
        localStorage.setItem(storageKey, 'true');
        setLoading(false);
    };

    const closeModal = () => {
        setShowModal(false);
    };

    return {
        showModal,
        topData,
        userPosition,
        loading,
        closeModal
    };
}