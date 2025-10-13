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

        // CORREGIDO: buscar por auth_id en lugar de id
        const { data, error } = await supabase
            .from('usuario')
            .select('*')
            .eq('auth_id', user.id)  // ← CAMBIAR A auth_id
            .single()

        return { data, error }
    },

    async createProfile(profileData) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { data: null, error: 'No hay usuario logueado' }

        const { data, error } = await supabase
            .from('usuario')
            .insert([{
                auth_id: user.id,  // ← CAMBIAR A auth_id
                correo: user.email,
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
            .eq('auth_id', user.id)  // ← CAMBIAR A auth_id
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
// 🔍 BÚSQUEDA GENERAL
// ==========================================
async function searchProfessors(term) {
    const q = (term || "").trim();
    if (!q) return { data: [], error: null };

    try {
        // ✅ USAR RPC CON SIMILITUD
        const { data: profesores, error } = await supabase
            .rpc('buscar_profesores_sin_tildes', { termino: q });

        if (error) {
            console.error('Error buscando profesores:', error);
            return { data: [], error };
        }

        const transformed = (profesores || []).map(prof => ({
            id: prof.id_profesor,
            id_profesor: prof.id_profesor,
            profesor_nombre: prof.profesor_nombre,
            materia_nombre: '',
            rating_promedio: 0,
            estrellas: 0
        }));

        return { data: transformed, error: null };

    } catch (error) {
        console.error('Error en searchProfessors:', error);
        return { data: [], error };
    }
}


async function searchSubjects(term) {
    const q = (term || "").trim();
    if (!q) return { data: [], error: null };

    try {
        const { data: materias, error } = await supabase
            .rpc('buscar_materias_sin_tildes', { termino: q });

        if (error) return { data: [], error };

        const transformed = (materias || []).map(materia => ({
            id: materia.id_materia,
            id_materia: materia.id_materia,
            nombre_materia: materia.nombre_materia,
            semestre: materia.semestre || '',
            label: materia.nombre_materia,
            source: 'materia'
        }));

        return { data: transformed, error: null };

    } catch (error) {
        return { data: [], error };
    }
}

async function searchNotes(term) {
    const q = (term || "").trim();
    if (!q) return { data: [], error: null };

    try {
        // ✅ USAR RPC CON SIMILITUD
        const { data: apuntes, error } = await supabase
            .rpc('buscar_apuntes_sin_tildes', { termino: q });

        if (error) {
            console.error('Error buscando apuntes:', error);
            return { data: [], error };
        }

        const transformed = (apuntes || []).map(a => ({
            id: a.id_apunte,
            id_apunte: a.id_apunte,
            titulo: a.titulo,
            estrellas: 4.0,
            materia_nombre: '',
            autor_nombre: ''
        }));

        return { data: transformed, error: null };

    } catch (error) {
        console.error('Error en searchNotes:', error);
        return { data: [], error };
    }
}

async function searchMentors(term) {
    const q = (term || "").trim();
    if (!q) return { data: [], error: null };

    const { data, error } = await supabase
        .rpc('buscar_mentores_sin_tildes', { termino: q });

    if (error) return { data: [], error };

    const transformed = (data || []).map(m => ({
        id: m.id_mentor,
        id_mentor: m.id_mentor,
        mentor_nombre: m.nombre || 'Mentor',
        mentor_correo: '',
        username: m.username,
        foto: m.foto,
        estrellas_mentor: m.estrellas_mentor,
        rating_promedio: m.estrellas_mentor,
        contacto: ''
    }));

    return { data: transformed, error: null };
}


async function searchUsers(term) {
    const q = (term || "").trim();
    if (!q) return { data: [], error: null };

    try {
        // ✅ OBTENER MI ID PRIMERO
        const { data: miIdData } = await supabase.rpc('obtener_usuario_actual_id');
        const miId = miIdData || null;

        const { data, error } = await supabase
            .rpc('buscar_usuarios_sin_tildes', { termino: q });

        if (error) {
            console.error('Error buscando usuarios:', error);
            return { data: [], error };
        }

        // ✅ FILTRAR MI PROPIO USUARIO
        const usuariosFiltrados = (data || []).filter(usuario => {
            return miId ? usuario.id_usuario !== miId : true;
        });

        const transformed = usuariosFiltrados.map(usuario => ({
            id: usuario.id_usuario,
            id_usuario: usuario.id_usuario,
            nombre: usuario.nombre,
            foto: usuario.foto,
            username: usuario.username,
            tipo: 'usuario',
            label: usuario.nombre
        }));

        return { data: transformed, error: null };

    } catch (error) {
        console.error('Error en searchUsers:', error);
        return { data: [], error };
    }
}

export const searchAPI = {
    searchProfessors,
    searchSubjects,
    searchNotes,
    searchMentors,
    searchUsers,
    async searchAll(term) {
        const [prof, mat, ap, men, users] = await Promise.all([
            searchProfessors(term),
            searchSubjects(term),
            searchNotes(term),
            searchMentors(term),
            searchUsers(term),
        ]);

        // ✅ AGREGAR ESTOS LOGS
        console.log('🔍 Resultados individuales:', {
            profesores: { data: prof.data, error: prof.error },
            materias: { data: mat.data, error: mat.error },
            apuntes: { data: ap.data, error: ap.error },
            mentores: { data: men.data, error: men.error },
            usuarios: { data: users.data, error: users.error }
        });

        return {
            data: {
                profesores: prof.data ?? [],
                materias: mat.data ?? [],
                apuntes: ap.data ?? [],
                mentores: men.data ?? [],
                usuarios: users.data ?? [],
            },
            error: prof.error || mat.error || ap.error || men.error || users.error || null,
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
        estrellas_mentor,
        contacto,
        descripcion
    `)
            .eq('id_mentor', usuarioData.id_usuario)
            .maybeSingle()

        if (data) {
            const { data: materias } = await supabase
                .from('mentor_materia')
                .select(`
            id_materia,
            materia(nombre_materia, semestre)
        `)
                .eq('id_mentor', data.id_mentor)

        }if (data) {
            const { data: materias } = await supabase
                .from('mentor_materia')
                .select(`
            id_materia,
            materia(nombre_materia, semestre)
        `)
                .eq('id_mentor', data.id_mentor)

            data.mentor_materias = materias
        }

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
// ==========================================
// 👥 SEGUIDORES (Versión Kerana)
// ==========================================
export const followersAPI = {
    async followProfessor(profesorId) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { data: null, error: 'No hay usuario logueado' }

        const { data: currentUser } = await supabase
            .from('usuario')
            .select('id_usuario')
            .eq('auth_id', user.id)
            .single()

        if (!currentUser) return { data: null, error: 'Usuario no encontrado' }

        const { data, error } = await supabase
            .from('seguidores')
            .insert([{
                seguidor_id: currentUser.id_usuario,
                seguido_id: profesorId,
                estado: 'activo',
                tipo: 'profesor'
            }])
            .select()

        return { data, error }
    },

    async followMentor(mentorId) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { data: null, error: 'No hay usuario logueado' }

        const { data: currentUser } = await supabase
            .from('usuario')
            .select('id_usuario')
            .eq('auth_id', user.id)
            .single()

        if (!currentUser) return { data: null, error: 'Usuario no encontrado' }

        const { data, error } = await supabase
            .from('seguidores')
            .insert([{
                seguidor_id: currentUser.id_usuario,
                seguido_id: mentorId,
                estado: 'activo',
                tipo: 'mentor'
            }])
            .select()

        // Notificar al mentor
        if (data && !error) {
            await notificationsAPI.createNotification(
                mentorId,
                'nuevo_seguidor_mentor',
                currentUser.id_usuario,
                data[0].id,
                `Un estudiante empezó a seguirte como mentor`
            )
        }

        return { data, error }
    },

    async unfollowUser(userIdToUnfollow) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { data: null, error: 'No hay usuario logueado' }

        const { data: currentUser } = await supabase
            .from('usuario')
            .select('id_usuario')
            .eq('auth_id', user.id)
            .single()

        if (!currentUser) return { data: null, error: 'Usuario no encontrado' }

        const { data, error } = await supabase
            .from('seguidores')
            .delete()
            .eq('seguidor_id', currentUser.id_usuario)
            .eq('seguido_id', userIdToUnfollow)

        return { data, error }
    },

    async getMyFollowedProfessors() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { data: null, error: 'No hay usuario logueado' }

        const { data: currentUser } = await supabase
            .from('usuario')
            .select('id_usuario')
            .eq('auth_id', user.id)
            .single()

        const { data, error } = await supabase
            .from('seguidores')
            .select(`
                *,
                profesor:usuario!seguidores_seguido_id_fkey(
                    id_usuario,
                    nombre,
                    correo,
                    profesor_curso(*)
                )
            `)
            .eq('seguidor_id', currentUser.id_usuario)
            .eq('tipo', 'profesor')
            .eq('estado', 'activo')

        return { data, error }
    },

    async getMyFollowedMentors() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { data: null, error: 'No hay usuario logueado' }

        const { data: currentUser } = await supabase
            .from('usuario')
            .select('id_usuario')
            .eq('auth_id', user.id)
            .single()

        const { data, error } = await supabase
            .from('seguidores')
            .select(`
                *,
                mentor:usuario!seguidores_seguido_id_fkey(
                    id_usuario,
                    nombre,
                    correo,
                    mentor(*)
                )
            `)
            .eq('seguidor_id', currentUser.id_usuario)
            .eq('tipo', 'mentor')
            .eq('estado', 'activo')

        return { data, error }
    },

    async isFollowingProfessor(profesorId) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { data: null, error: 'No hay usuario logueado' }

        const { data: currentUser } = await supabase
            .from('usuario')
            .select('id_usuario')
            .eq('auth_id', user.id)
            .single()

        const { data, error } = await supabase
            .from('seguidores')
            .select('id')
            .eq('seguidor_id', currentUser.id_usuario)
            .eq('seguido_id', profesorId)
            .eq('tipo', 'profesor')
            .eq('estado', 'activo')
            .maybeSingle()

        return { data: !!data, error }
    },

    async isFollowingMentor(mentorId) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { data: null, error: 'No hay usuario logueado' }

        const { data: currentUser } = await supabase
            .from('usuario')
            .select('id_usuario')
            .eq('auth_id', user.id)
            .single()

        const { data, error } = await supabase
            .from('seguidores')
            .select('id')
            .eq('seguidor_id', currentUser.id_usuario)
            .eq('seguido_id', mentorId)
            .eq('tipo', 'mentor')
            .eq('estado', 'activo')
            .maybeSingle()

        return { data: !!data, error }
    }
}

// ==========================================
// 🔔 NOTIFICACIONES (Versión Kerana)
// ==========================================
export const notificationsAPI = {
    async getMyNotifications() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { data: null, error: 'No hay usuario logueado' }

        const { data: usuarioData } = await supabase
            .from('usuario')
            .select('id_usuario')
            .eq('auth_id', user.id)
            .single()

        if (!usuarioData) return { data: null, error: 'Usuario no encontrado' }

        const { data, error } = await supabase
            .from('notificaciones')
            .select(`
                *,
                emisor:usuario!notificaciones_emisor_id_fkey(
                    id_usuario,
                    nombre,
                    foto
                )
            `)
            .eq('usuario_id', usuarioData.id_usuario)
            .order('creado_en', { ascending: false })

        return { data, error }
    },

    async notifyNewMentorSession(alumnoId, mentorId, sesionId, materiaNombre) {
        return await this.createNotification(
            mentorId,
            'nueva_solicitud_mentoria',
            alumnoId,
            sesionId,
            `Nueva solicitud de mentoría para ${materiaNombre}`
        )
    },

    async notifySessionConfirmed(alumnoId, mentorId, sesionId, materiaNombre) {
        return await this.createNotification(
            alumnoId,
            'mentoria_confirmada',
            mentorId,
            sesionId,
            `Tu mentoría de ${materiaNombre} ha sido confirmada`
        )
    },

    async notifySessionCancelled(alumnoId, mentorId, sesionId, materiaNombre) {
        return await this.createNotification(
            alumnoId,
            'mentoria_cancelada',
            mentorId,
            sesionId,
            `Tu mentoría de ${materiaNombre} ha sido cancelada`
        )
    },

    async notifyNewRating(ratedUserId, raterId, materiaNombre, ratingId) {
        return await this.createNotification(
            ratedUserId,
            'nueva_calificacion',
            raterId,
            ratingId,
            `Nueva calificación recibida para ${materiaNombre}`
        )
    },

    async notifyMentorApplicationUpdate(usuarioId, materiaNombre, estado) {
        return await this.createNotification(
            usuarioId,
            'actualizacion_aplicacion_mentor',
            null,
            null,
            `Tu aplicación para mentor de ${materiaNombre} ha sido ${estado}`
        )
    },

    async createNotification(usuarioId, tipo, emisorId, relacionId, mensaje) {
        const { data, error } = await supabase
            .from('notificaciones')
            .insert([{
                usuario_id: usuarioId,
                tipo,
                emisor_id: emisorId,
                relacion_id: relacionId,
                mensaje
            }])
            .select()

        return { data, error }
    },

    async markAsRead(notificationId) {
        const { data, error } = await supabase
            .from('notificaciones')
            .update({ leida: true })
            .eq('id', notificationId)
            .select()

        return { data, error }
    },

    async markAllAsRead() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { data: null, error: 'No hay usuario logueado' }

        const { data: usuarioData } = await supabase
            .from('usuario')
            .select('id_usuario')
            .eq('auth_id', user.id)
            .single()

        if (!usuarioData) return { data: null, error: 'Usuario no encontrado' }

        const { data, error } = await supabase
            .from('notificaciones')
            .update({ leida: true })
            .eq('usuario_id', usuarioData.id_usuario)
            .eq('leida', false)
            .select()

        return { data, error }
    },

    async getUnreadCount() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { data: null, error: 'No hay usuario logueado' }

        const { data: usuarioData } = await supabase
            .from('usuario')
            .select('id_usuario')
            .eq('auth_id', user.id)
            .single()

        if (!usuarioData) return { data: null, error: 'Usuario no encontrado' }

        const { count, error } = await supabase
            .from('notificaciones')
            .select('*', { count: 'exact', head: true })
            .eq('usuario_id', usuarioData.id_usuario)
            .eq('leida', false)

        return { data: count || 0, error }
    }
}