import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { creditsAPI } from '../api/database';

export function useTopMensual() {
    const [showModal, setShowModal] = useState(false);
    const [topData, setTopData] = useState(null);
    const [userPosition, setUserPosition] = useState(null);
    const [loading, setLoading] = useState(true);
    const [calculating, setCalculating] = useState(false);

    useEffect(() => {
        checkAndShowTopMensual();
    }, []);

    const checkAndShowTopMensual = async () => {
        try {
            const hoy = new Date();
            const dia = hoy.getDate();

            // Solo mostrar entre día 1 y 5
            if (dia > 5) {
                setLoading(false);
                return;
            }

            // Mes anterior (el que se premia)
            const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
            const mes = mesAnterior.getMonth() + 1;
            const año = mesAnterior.getFullYear();

            // Verificar si el usuario ya vio el modal este mes
            const storageKey = `top_mensual_visto_${mes}_${año}`;
            const yaVisto = localStorage.getItem(storageKey);

            if (yaVisto) {
                setLoading(false);
                return;
            }

            // Verificar si ya existe el top de este mes
            const { data: topExistente, error: topError } = await creditsAPI.getTopMensual(mes, año);

            if (topError) {
                console.error('Error obteniendo top:', topError);
                setLoading(false);
                return;
            }

            // Si NO existe, calcular automáticamente
            if (!topExistente || topExistente.length === 0) {
                console.log(`📊 Top de ${mes}/${año} no existe, calculando...`);
                setCalculating(true);

                try {
                    // Llamar a la Edge Function para calcular
                    const { error: calcError } = await supabase.functions.invoke('calcular-top-mensual');

                    if (calcError) {
                        console.error('Error calculando top:', calcError);
                        setLoading(false);
                        setCalculating(false);
                        return;
                    }

                    // Esperar un momento y volver a obtener
                    await new Promise(resolve => setTimeout(resolve, 2000));

                    const { data: topNuevo } = await creditsAPI.getTopMensual(mes, año);
                    if (topNuevo && topNuevo.length > 0) {
                        await showTopModal(topNuevo, mes, año, storageKey);
                    }
                } catch (error) {
                    console.error('Error en cálculo automático:', error);
                } finally {
                    setCalculating(false);
                }
            } else {
                // Ya existe, mostrar directamente
                await showTopModal(topExistente, mes, año, storageKey);
            }

        } catch (error) {
            console.error('Error en checkAndShowTopMensual:', error);
        } finally {
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

        // Marcar como visto
        localStorage.setItem(storageKey, 'true');
    };

    const closeModal = () => {
        setShowModal(false);
    };

    return {
        showModal,
        topData,
        userPosition,
        loading,
        calculating,
        closeModal
    };
}