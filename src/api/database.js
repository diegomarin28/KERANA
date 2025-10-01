// src/api/Database.js
import { supabase } from '../supabase'
import emailjs from '@emailjs/browser';

// ==========================================
// 🧑‍🎓 USUARIOS
// ==========================================
export const userAPI = {
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

    async updateProfile(profileData) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { data: null, error: 'No hay usuario logueado' }

        const { data, error } = await supabase
            .from('usuario')
            .update(profileData)
            .eq('id', user.id)
            .select()

        return { data, error }
    }
}

// ==========================================
// 🎓 MATERIAS Y CONTENIDO
// ==========================================

export const subjectsAPI = {
    async getAllSubjects() {
        const { data, error } = await supabase
            .from('materias_con_contenido')
            .select('*')
            .order('nombre_materia')

        return { data, error }
    },

    async getAllSubjectsSimple() {
        const { data, error } = await supabase
            .from('materia')
            .select('id_materia, nombre_materia, semestre')
            .order('nombre_materia')

        return { data, error }
    },

    async getSubjectContent(materiaId) {
        const [apuntes, profesores, mentores] = await Promise.all([
            supabase.from('apunte').select('*').eq('id_materia', materiaId),
            supabase
                .from('imparte')
                .select(`id_profesor,profesor_curso!inner(*, usuario(*))`)
                .eq('id_materia', materiaId),
            supabase
                .from('mentor_materia')
                .select('mentor(*, usuario(*))')
                .eq('id_materia', materiaId)
        ]);

        const profesoresList = (profesores.data || []).map(row => row.profesor_curso);

        return {
            apuntes: apuntes.data || [],
            profesores: profesores.data || [],
            mentores: mentores.data || [],
            errors: {
                apuntes: apuntes.error,
                profesores: profesores.error,
                mentores: mentores.error
            }
        }
    }
}

// ==========================================
// 📚 BÚSQUEDA GENERAL
// ==========================================

async function searchProfessors(term) {
    const q = (term || "").trim();
    if (!q) return { data: [], error: null };
    const { data, error } = await supabase.rpc("buscar_cursos", { termino: q });
    return { data, error };
}

async function searchSubjects(term) {
    const q = (term || "").trim();
    if (!q) return { data: [], error: null };

    const { data, error } = await supabase.rpc("buscar_materias_fuzzy", { termino: q });
    return { data, error };
}

async function searchNotes(term) {
    const q = (term || "").trim();
    let base = supabase
        .from("apuntes_completos")
        .select("id_apunte,autor_nombre,materia_nombre,estrellas,creditos")
        .limit(50);
    const { data, error } = q
        ? await base.or(`autor_nombre.ilike.*${q}*,materia_nombre.ilike.*${q}*`)
        : await base;
    return { data, error };
}

async function searchMentors(term) {
    const q = (term || "").trim();
    let base = supabase
        .from("mentores_con_stats")
        .select("id_mentor,mentor_nombre,mentor_correo,rating_promedio,estrellas_mentor,contacto,total_calificaciones")
        .limit(50);
    const { data, error } = q ? await base.ilike("mentor_nombre", `*${q}*`) : await base;
    return { data, error };
}

export const searchAPI = {
    searchProfessors,
    searchSubjects,
    searchNotes,
    searchMentors,
    async searchAll(term) {
        const [prof, mat, ap, men] = await Promise.all([
            searchProfessors(term),
            searchSubjects(term),
            searchNotes(term),
            searchMentors(term),
        ]);
        return {
            data: {
                profesores: prof.data ?? [],
                materias: mat.data ?? [],
                apuntes: ap.data ?? [],
                mentores: men.data ?? [],
            },
            error: prof.error || mat.error || ap.error || men.error || null,
        };
    },
};

// ==========================================
// 🎯 MENTORES Y POSTULACIONES
// ==========================================
export const mentorAPI = {
    async applyMentor(applicationData) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { data: null, error: 'No hay usuario logueado' }


        const { data, error } = await supabase
            .from('mentor_aplicacion')
            .insert([{
                id_usuario: user.id,
                id_materia: applicationData.materiaId,
                motivo: applicationData.motivo,
                calificacion_materia: applicationData.calificacion,
                comprobante_archivo: applicationData.comprobante,
                estado: 'pendiente'
            }])
            .select()
        if (data && !error) {
            await this.notifyNewApplication(data[0].id)
        }

        return { data, error }
    },

    async notifyNewApplication(applicationId, userEmail, materiaNombre) {
        try {
            // Usar EmailJS igual que en Contact.jsx
            await emailjs.send(
                "service_dan74a5",
                "template_e9obnfd",
                {
                    application_id: applicationId,
                    user_email: userEmail,
                    materia_nombre: materiaNombre,
                    message: `Nueva aplicación de mentor recibida de ${userEmail} para la materia ${materiaNombre}`,
                    to_name: "Administrador Kerana",
                    subject: "📚 Nueva aplicación de mentor - Kerana"
                },
                "DMO310micvFWXx-j4"
            );

            console.log('✅ Notificación de aplicación enviada por email');
        } catch (error) {
            console.log('❌ Notificación falló, pero aplicación se guardó:', error);
        }
    },

    async getMyMentorStatus() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { data: null, error: 'No hay usuario logueado' }

        const { data: usuarioData } = await supabase
            .from('usuario')
            .select('id_usuario')
            .eq('auth_id', user.id)
            .single()

        if (!usuarioData) return { data: null, error: 'Usuario no encontrado' }

        const { data, error } = await supabase
            .from('mentor')
            .select(`
                id_mentor,
                estrellas,
                contacto,
                mentor_materia(
                    materia(id_materia, nombre_materia, semestre)
                )
            `)
            .eq('id_usuario', usuarioData.id_usuario)
            .single()

        return { data, error }
    },

    async getPendingApplications() {
        const { data, error } = await supabase
            .from('mentor_aplicacion')
            .select(`
                *,
                usuario(nombre, email),
                materia(nombre_materia)
            `)
            .eq('estado', 'pendiente')
            .order('created_at', { ascending: false })

        return { data, error }
    },

    async approveApplication(applicationId) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { data: null, error: 'No autorizado' }

        try {
            const { data: app } = await supabase
                .from('mentor_aplicacion')
                .select('*')
                .eq('id', applicationId)
                .single()

            if (!app) return { data: null, error: 'Aplicación no encontrada' }

            const { data: existingMentor } = await supabase
                .from('mentor')
                .select('id_mentor')
                .eq('id_usuario', app.id_usuario)
                .single()

            let mentorId = existingMentor?.id_mentor

            if (!mentorId) {
                const { data: newMentor, error: mentorError } = await supabase
                    .from('mentor')
                    .insert([{
                        id_usuario: app.id_usuario,
                        estrellas: 5,
                        contacto: ''
                    }])
                    .select('id_mentor')
                    .single()

                if (mentorError) return { data: null, error: mentorError.message }
                mentorId = newMentor.id_mentor
            }

            await supabase
                .from('mentor_materia')
                .insert([{
                    id_mentor: mentorId,
                    id_materia: app.id_materia
                }])

            const { data, error } = await supabase
                .from('mentor_aplicacion')
                .update({ estado: 'aprobado' })
                .eq('id', applicationId)
                .select()

            return { data, error }

        } catch (error) {
            return { data: null, error: error.message }
        }
    },

    async getMentorsBySubject(materiaId) {
        const { data, error } = await supabase
            .from('mentor_materia')
            .select(`
                mentor(*, usuario(nombre, email))
            `)
            .eq('id_materia', materiaId)

        return { data, error }
    }
}

// ==========================================
// 📄 APUNTES
// ==========================================
export const notesAPI = {
    async searchNotes(searchTerm) {
        const { data, error } = await supabase
            .from('apunte')
            .select('*, materia(nombre_materia)')
            .ilike('titulo', `%${searchTerm}%`)

        return { data, error }
    },

    async getNotesBySubject(materiaId) {
        const { data, error } = await supabase
            .from('apunte')
            .select('*')
            .eq('id_materia', materiaId)

        return { data, error }
    }
}

// ==========================================
// ⭐ FAVORITOS
// ==========================================
export const favoritesAPI = {
    async addToFavorites(itemId, itemType) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { data: null, error: 'No hay usuario logueado' }

        const tableName = itemType === 'apunte' ? 'apunte_fav' : 'usuario_fav'
        const columnName = itemType === 'apunte' ? 'apunte_id' : 'profesor_curso_id'

        const { data, error } = await supabase
            .from(tableName)
            .insert([{
                usuario_id: user.id,
                [columnName]: itemId
            }])
            .select()

        return { data, error }
    },

    async removeFromFavorites(itemId, itemType) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { data: null, error: 'No hay usuario logueado' }

        const tableName = itemType === 'apunte' ? 'apunte_fav' : 'usuario_fav'
        const columnName = itemType === 'apunte' ? 'apunte_id' : 'profesor_curso_id'

        const { data, error } = await supabase
            .from(tableName)
            .delete()
            .eq('usuario_id', user.id)
            .eq(columnName, itemId)

        return { data, error }
    }
}

export const ratingsAPI = {
    async createRating(courseId, estrellas, comentario, extra = {}) {
        const { data: authData, error: authErr } = await supabase.auth.getUser();
        const user = authData?.user;
        if (authErr || !user) {
            return { data: null, error: { message: "Debes iniciar sesión para reseñar." } };
        }

        const payload = {
            tipo: 'materia',
            ref_id: courseId,
            estrellas,
            comentario: comentario?.trim() || null,
            titulo: extra.titulo?.trim() || null,
            workload: extra.workload || null,
            metodologia: extra.metodologia || null,
            user_id: user.id
        };

        const { data, error } = await supabase
            .from('rating')
            .insert(payload)
            .select()
            .single();

        return { data, error };
    },

    async listByMateria(materiaId) {
        return await supabase
            .from('rating')
            .select('id, estrellas, comentario, titulo, workload, metodologia, user_id, created_at')
            .eq('tipo','materia')
            .eq('ref_id', materiaId)
            .order('created_at', { ascending: false });
    },

    async getAverageForMateria(materiaId) {
        const { data, error } = await supabase
            .from('rating')
            .select('estrellas', { count: 'exact' })
            .eq('tipo','materia')
            .eq('ref_id', materiaId);

        if (error) return { data: null, error };
        const count = data?.length || 0;
        const sum = (data || []).reduce((a, r) => a + (r.estrellas || 0), 0);
        return { data: { count, avg: count ? +(sum / count).toFixed(2) : 0 }, error: null };
    }
};

// ==========================================
// 👨‍🏫 PROFESORES
// ==========================================
export const professorAPI = {
    async getAllProfessors() {
        const {data, error} = await supabase
            .from('profesor_curso')
            .select(`
                *,
                imparte(materia(id_materia, nombre_materia))
            `)
        return {data, error}
    },

    async getProfessorsBySubject(materiaId) {
        const {data, error} = await supabase
            .from('imparte')
            .select(`
                *,
                profesor_curso(id_profesor, nombre_profesor, foto)
            `)
            .eq('id_materia', materiaId)

        return {data, error}
    }
}


// ==========================================
// 📅 MENTORÍAS Y CALENDARIO
// ==========================================
    export const mentorshipAPI = {
        // Disponibilidad del mentor
        async getMyDisponibilidad() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return { data: null, error: 'No hay usuario logueado' }

            const { data: usuarioData } = await supabase
                .from('usuario')
                .select('id_usuario')
                .eq('auth_id', user.id)
                .single()

            if (!usuarioData) return { data: null, error: 'Usuario no encontrado' }

            const { data: mentorData } = await supabase
                .from('mentor')
                .select('id_mentor')
                .eq('id_usuario', usuarioData.id_usuario)
                .single()

            if (!mentorData) return { data: null, error: 'No eres mentor' }

            const { data, error } = await supabase
                .from('mentor_disponibilidad')
                .select('*')
                .eq('id_mentor', mentorData.id_mentor)
                .order('dia_semana, hora_inicio')

            return { data, error }
        },

        async addDisponibilidad(diaSemana, horaInicio, horaFin) {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return { data: null, error: 'No hay usuario logueado' }

            const { data: usuarioData } = await supabase
                .from('usuario')
                .select('id_usuario')
                .eq('auth_id', user.id)
                .single()

            const { data: mentorData } = await supabase
                .from('mentor')
                .select('id_mentor')
                .eq('id_usuario', usuarioData.id_usuario)
                .single()

            const { data, error } = await supabase
                .from('mentor_disponibilidad')
                .insert([{
                    id_mentor: mentorData.id_mentor,
                    dia_semana: diaSemana,
                    hora_inicio: horaInicio,
                    hora_fin: horaFin,
                    activo: true
                }])
                .select()

            return { data, error }
        },

        async deleteDisponibilidad(idDisponibilidad) {
            const { data, error } = await supabase
                .from('mentor_disponibilidad')
                .delete()
                .eq('id_disponibilidad', idDisponibilidad)

            return { data, error }
        },

        async toggleDisponibilidad(idDisponibilidad, activo) {
            const { data, error } = await supabase
                .from('mentor_disponibilidad')
                .update({ activo })
                .eq('id_disponibilidad', idDisponibilidad)
                .select()

            return { data, error }
        },

        // Sesiones
        async getMySesiones() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return { data: null, error: 'No hay usuario logueado' }

            const { data: usuarioData } = await supabase
                .from('usuario')
                .select('id_usuario')
                .eq('auth_id', user.id)
                .single()

            const { data: mentorData } = await supabase
                .from('mentor')
                .select('id_mentor')
                .eq('id_usuario', usuarioData.id_usuario)
                .maybeSingle()

            if (mentorData) {
                // Es mentor, ver sus sesiones como mentor
                const { data, error } = await supabase
                    .from('mentor_sesion')
                    .select(`
                    *,
                    alumno:usuario!mentor_sesion_id_alumno_fkey(nombre, correo),
                    materia(nombre_materia)
                `)
                    .eq('id_mentor', mentorData.id_mentor)
                    .order('fecha_hora', { ascending: false })

                return { data, error }
            } else {
                // Es alumno, ver sus sesiones como alumno
                const { data, error } = await supabase
                    .from('mentor_sesion')
                    .select(`
                    *,
                    mentor!inner(*, usuario(nombre, correo)),
                    materia(nombre_materia)
                `)
                    .eq('id_alumno', usuarioData.id_usuario)
                    .order('fecha_hora', { ascending: false })

                return { data, error }
            }
        },

        async confirmarSesion(idSesion) {
            const { data, error } = await supabase
                .from('mentor_sesion')
                .update({ estado: 'confirmada' })
                .eq('id_sesion', idSesion)
                .select()

            return { data, error }
        },

        async cancelarSesion(idSesion) {
            const { data, error } = await supabase
                .from('mentor_sesion')
                .update({ estado: 'cancelada' })
                .eq('id_sesion', idSesion)
                .select()

            return { data, error }
        }
    }
