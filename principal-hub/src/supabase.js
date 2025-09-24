// src/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'TU_SUPABASE_URL_AQUI'
const supabaseKey = 'TU_SUPABASE_ANON_KEY_AQUI'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Funciones de autenticación
export const authAPI = {
    // Registrar usuario
    async signUp(email, password) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        })
        return { data, error }
    },

    // Iniciar sesión
    async signIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })
        return { data, error }
    },

    // Cerrar sesión
    async signOut() {
        const { error } = await supabase.auth.signOut()
        return { error }
    },

    // Obtener usuario actual
    async getCurrentUser() {
        const { data: { user } } = await supabase.auth.getUser()
        return user
    },

    // Escuchar cambios de autenticación
    onAuthChange(callback) {
        return supabase.auth.onAuthStateChange(callback)
    }
}