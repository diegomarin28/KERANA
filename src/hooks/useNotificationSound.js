import { useEffect, useRef } from 'react';

let audioContext = null;
let audioUnlocked = false;

export function useNotificationSound() {
    const unlockedRef = useRef(false);

    // Desbloquear audio con la primera interacción
    useEffect(() => {
        const unlockAudio = async () => {
            if (unlockedRef.current || audioUnlocked) return;

            try {
                if (!audioContext) {
                    audioContext = new (window.AudioContext || window.webkitAudioContext)();
                }

                const buffer = audioContext.createBuffer(1, 1, 22050);
                const source = audioContext.createBufferSource();
                source.buffer = buffer;
                source.connect(audioContext.destination);
                source.start(0);

                audioUnlocked = true;
                unlockedRef.current = true;
                console.log('🔓 Audio desbloqueado (useNotificationSound)');

                document.removeEventListener('click', unlockAudio);
                document.removeEventListener('touchstart', unlockAudio);
                document.removeEventListener('keydown', unlockAudio);
            } catch (error) {
                console.log('⚠️ No se pudo desbloquear audio:', error);
            }
        };

        document.addEventListener('click', unlockAudio);
        document.addEventListener('touchstart', unlockAudio);
        document.addEventListener('keydown', unlockAudio);

        return () => {
            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('touchstart', unlockAudio);
            document.removeEventListener('keydown', unlockAudio);
        };
    }, []);

    // Función para reproducir sonidos
    const playSound = (tipo = 'default') => {
        if (!audioUnlocked || !audioContext) {
            console.log('⚠️ Audio no disponible aún');
            return;
        }

        try {
            const now = audioContext.currentTime;

            switch (tipo) {
                case 'apunte_publicado':
                    // 🎉 Sonido de éxito con celebración (Fa-La-Do-Mi)
                    playNote(698, now, 0.2, 0.12);        // Fa
                    playNote(880, now + 0.08, 0.2, 0.12); // La
                    playNote(1047, now + 0.16, 0.2, 0.12); // Do
                    playNote(1319, now + 0.24, 0.25, 0.2); // Mi alto
                    break;

                case 'upload_success':
                    // ✅ Sonido de subida exitosa
                    playNote(800, now, 0.2, 0.1);
                    playNote(1000, now + 0.08, 0.2, 0.1);
                    playNote(1200, now + 0.16, 0.25, 0.15);
                    break;

                case 'action_success':
                    // ✨ Acción completada con éxito
                    playNote(900, now, 0.2, 0.12);
                    playNote(1100, now + 0.1, 0.25, 0.15);
                    break;

                case 'error':
                    // ❌ Sonido de error (descendente)
                    playNote(600, now, 0.25, 0.15);
                    playNote(400, now + 0.1, 0.3, 0.2);
                    break;

                default:
                    // 🔔 Sonido genérico
                    playNote(800, now, 0.2, 0.15);
                    playNote(1000, now + 0.1, 0.2, 0.15);
            }

            console.log(`🔔 Sonido reproducido: ${tipo}`);
        } catch (error) {
            console.log('⚠️ Error al reproducir sonido:', error);
        }
    };

    return { playSound };
}

// Helper para tocar una nota individual
function playNote(frequency, startTime, volume = 0.2, duration = 0.15) {
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    // Envelope (fade in/out)
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
}