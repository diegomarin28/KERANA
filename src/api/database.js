// src/api/database.js
import { supabase } from '../supabase'

// ==========================================
// 🧑‍🎓 USUARIOS
// ==========================================
export const userAPI = {
    // Obtener perfil del usuario actual
    async getCurrentProfile() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { data: null, error: 'No hay usuario logueado' }

        const { data, error } = await supabase
            .from('usuario')
            .select('*')
            .eq('id', user.id)
            .single()

        return { data, error }
    },

    // Crear perfil de usuario (después del registro)
    async createProfile(profileData) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { data: null, error: 'No hay usuario logueado' }

        const { data, error } = await supabase
            .from('usuario')
            .insert([{
                id: user.id,
                email: user.email,
                ...profileData
            }])
            .select()

        return { data, error }
    },

    // Actualizar perfil
    async updateProfile(profileData) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { data: null, error: 'No hay usuario logueado' }

        const { data, error } = await supabase
            .from('usuario')
            .update(profileData)
            .eq('id', user.id)
            .select()

        return { data, error }
    },

    // Obtener favoritos del usuario
    async getUserFavorites() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { data: null, error: 'No hay usuario logueado' }

        const { data, error } = await supabase
            .from('usuario_fav')
            .select(`
        *,
        profesor_curso(
          *,
          usuario(*),
          materia(*)
        )
      `)
            .eq('usuario_id', user.id)

        return { data, error }
    }
}

// ==========================================
// 👨‍🏫 PROFESORES Y “CURSOS” (profesor+materia)
// ==========================================
export const courseAPI = {
    // Listado (con stats)
    async getAllCourses() {
        const { data, error } = await supabase
            .from('cursos_con_stats')
            .select('*')
            .order('rating_promedio', { ascending: false })

        return { data, error }
    },

    // Búsqueda/filtrado
    async searchCourses(filters = {}) {
        let query = supabase
            .from('cursos_con_stats')
            .select('*')

        if (filters.materia) {
            query = query.eq('id_materia', filters.materia)      // 👈 ahora filtra por id_materia de la vista
        }
        if (filters.profesorNombre) {
            query = query.ilike('profesor_nombre', `%${filters.profesorNombre}%`)
        }

        // Orden por rating (default)
        if (!filters.sortBy || filters.sortBy === 'rating_desc') {
            query = query.order('rating_promedio', { ascending: false })
        }

        const { data, error } = await query
        return { data, error }
    },

    // Detalle por par (id_profesor, id_materia)
    async getCourseByIds(idProfesor, idMateria) {
        const { data, error } = await supabase
            .from('cursos_con_stats')
            .select('*')
            .eq('id_profesor', idProfesor)
            .eq('id_materia', idMateria)
            .single()

        return { data, error }
    },

    // O detalle por clave compuesta textual, si usás /cursos/:cursoKey
    async getCourseByKey(cursoKey) {
        const { data, error } = await supabase
            .from('cursos_con_stats')
            .select('*')
            .eq('curso_key', cursoKey)
            .single()

        return { data, error }
    }
}


// ==========================================
// ⭐ FAVORITOS
// ==========================================
export const favoritesAPI = {
    // Agregar curso a favoritos
    async addToFavorites(courseId) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { data: null, error: 'No hay usuario logueado' }

        const { data, error } = await supabase
            .from('usuario_fav')
            .insert([{
                usuario_id: user.id,
                profesor_curso_id: courseId
            }])
            .select()

        return { data, error }
    },

    // Quitar de favoritos
    async removeFromFavorites(courseId) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { data: null, error: 'No hay usuario logueado' }

        const { data, error } = await supabase
            .from('usuario_fav')
            .delete()
            .eq('usuario_id', user.id)
            .eq('profesor_curso_id', courseId)

        return { data, error }
    },

    // Verificar si está en favoritos
    async isFavorite(courseId) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { data: false, error: null }

        const { data, error } = await supabase
            .from('usuario_fav')
            .select('id')
            .eq('usuario_id', user.id)
            .eq('profesor_curso_id', courseId)
            .single()

        return { data: !!data, error }
    }
}

// ==========================================
// 📚 APUNTES
// ==========================================
export const notesAPI = {
    // Obtener apuntes de un curso
    async getCourseNotes(courseId) {
        const { data, error } = await supabase
            .from('apunte')
            .select(`
        *,
        apunte_fav(count)
      `)
            .eq('profesor_curso_id', courseId)

        return { data, error }
    },

    // Buscar apuntes
    async searchNotes(searchTerm) {
        const { data, error } = await supabase
            .from('apunte')
            .select(`
        *,
        profesor_curso(
          *,
          usuario(nombre),
          materia(nombre)
        )
      `)
            .ilike('titulo', `%${searchTerm}%`)

        return { data, error }
    },

    // Marcar apunte como favorito
    async addNoteToFavorites(noteId) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { data: null, error: 'No hay usuario logueado' }

        const { data, error } = await supabase
            .from('apunte_fav')
            .insert([{
                usuario_id: user.id,
                apunte_id: noteId
            }])
            .select()

        return { data, error }
    }
}

// ==========================================
// ⭐ CALIFICACIONES
// ==========================================
export const ratingsAPI = {
    // Crear calificación
    async createRating(courseId, rating, comment) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { data: null, error: 'No hay usuario logueado' }

        const { data, error } = await supabase
            .from('califica')
            .insert([{
                usuario_id: user.id,
                profesor_curso_id: courseId,
                puntuacion: rating,
                comentario: comment
            }])
            .select()

        return { data, error }
    },

    // Obtener calificaciones de un curso
    async getCourseRatings(courseId) {
        const { data, error } = await supabase
            .from('califica')
            .select(`
        *,
        usuario(nombre)
      `)
            .eq('profesor_curso_id', courseId)
            .order('created_at', { ascending: false })

        return { data, error }
    },

    // Obtener promedio de calificaciones
    async getCourseAverageRating(courseId) {
        const { data, error } = await supabase
            .rpc('get_course_average_rating', { course_id: courseId })

        return { data, error }
    }
}

// ==========================================
// 🎓 MATERIAS
// ==========================================
export const subjectsAPI = {
    // Obtener todas las materias
    async getAllSubjects() {
        const { data, error } = await supabase
            .from('materia')
            .select('*')
            .order('nombre')

        return { data, error }
    },

    // Obtener cursos por materia
    async getCoursesBySubject(subjectId) {
        const { data, error } = await supabase
            .from('profesor_curso')
            .select(`
        *,
        usuario(*),
        materia(*),
        califica(puntuacion)
      `)
            .eq('materia_id', subjectId)

        return { data, error }
    }
}

// ==========================================
// 🧑‍🏫 MENTORES
// ==========================================
export const mentorAPI = {
    // Obtener todos los mentores
    async getAllMentors() {
        const { data, error } = await supabase
            .from('mentor')
            .select(`
        *,
        usuario(*),
        evalua(
          puntuacion,
          comentario,
          usuario(nombre)
        )
      `)

        return { data, error }
    },

    // Buscar mentores
    async searchMentors(filters = {}) {
        let query = supabase
            .from('mentor')
            .select(`
        *,
        usuario(*),
        evalua(puntuacion)
      `)

        if (filters.especialidad) {
            query = query.ilike('especialidad', `%${filters.especialidad}%`)
        }

        if (filters.maxPrice) {
            query = query.lte('precio_hora', filters.maxPrice)
        }

        const { data, error } = await query
        return { data, error }
    }
}

// ==========================================
// 💰 COMPRAS
// ==========================================
export const purchaseAPI = {
    // Crear compra
    async createPurchase(courseId, paymentData) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { data: null, error: 'No hay usuario logueado' }

        const { data, error } = await supabase
            .from('comprar')
            .insert([{
                usuario_id: user.id,
                profesor_curso_id: courseId,
                monto: paymentData.amount,
                metodo_pago: paymentData.paymentMethod,
                estado: 'completado'
            }])
            .select()

        return { data, error }
    },

    // Obtener compras del usuario
    async getUserPurchases() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { data: null, error: 'No hay usuario logueado' }

        const { data, error } = await supabase
            .from('comprar')
            .select(`
        *,
        profesor_curso(
          *,
          usuario(nombre),
          materia(nombre)
        )
      `)
            .eq('usuario_id', user.id)
            .order('created_at', { ascending: false })

        return { data, error }
    },

    // Verificar si el usuario compró un curso
    async hasPurchased(courseId) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { data: false, error: null }

        const { data, error } = await supabase
            .from('comprar')
            .select('id')
            .eq('usuario_id', user.id)
            .eq('profesor_curso_id', courseId)
            .eq('estado', 'completado')
            .single()

        return { data: !!data, error }
    }
}

// ==========================================
// 📊 ADMIN (solo para ti)
// ==========================================
export const adminAPI = {
    // Obtener estadísticas generales
    async getStats() {
        const [users, courses, mentors, purchases] = await Promise.all([
            supabase.from('usuario').select('id', { count: 'exact' }),
            supabase.from('profesor_curso').select('id', { count: 'exact' }),
            supabase.from('mentor').select('id', { count: 'exact' }),
            supabase.from('comprar').select('monto')
        ])

        const totalRevenue = purchases.data?.reduce((sum, purchase) => sum + purchase.monto, 0) || 0

        return {
            totalUsers: users.count,
            totalCourses: courses.count,
            totalMentors: mentors.count,
            totalRevenue
        }
    },

    // Obtener todos los usuarios
    async getAllUsers() {
        const { data, error } = await supabase
            .from('usuario')
            .select('*')
            .order('created_at', { ascending: false })

        return { data, error }
    },

    // Bannear/desbanear usuario
    async toggleUserBan(userId, banned = true) {
        const { data, error } = await supabase
            .from('usuario')
            .update({ banned })
            .eq('id', userId)
            .select()

        return { data, error }
    }
}