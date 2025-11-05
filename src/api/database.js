import { supabase } from '../supabase'
import emailjs from '@emailjs/browser';
import { validarComentario } from '../utils/wordFilter';


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
            .eq('auth_id', user.id)
            .single()

        return { data, error }
    },

    async createProfile(profileData) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { data: null, error: 'No hay usuario logueado' }

        const { data, error } = await supabase
            .from('usuario')
            .insert([{
                auth_id: user.id,
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
            .eq('auth_id', user.id)
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
            supabase.from('apunte').select('*, thumbnail_path').eq('id_materia', materiaId),
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
// SOLO LA FUNCIÓN searchProfessors - Reemplazá esta función en Database.js

async function searchProfessors(term) {
    const q = (term || "").trim();
    if (!q) return { data: [], error: null };

    try {
        // 1. Buscar profesores por NOMBRE
        const { data: profesoresPorNombre, error: errorNombre } = await supabase
            .rpc('buscar_profesores_sin_tildes', { termino: q });

        if (errorNombre) {
            console.error('Error buscando profesores por nombre:', errorNombre);
        }

        // 2. Buscar profesores por MATERIA
        const { data: profesoresPorMateria, error: errorMateria } = await supabase
            .rpc('buscar_profesores_por_materia', { termino: q });

        if (errorMateria) {
            console.error('Error buscando profesores por materia:', errorMateria);
        }

        // 3. Combinar resultados (evitar duplicados)
        const profesoresMap = new Map();

        // Agregar profesores encontrados por nombre
        (profesoresPorNombre || []).forEach(prof => {
            if (!profesoresMap.has(prof.id_profesor)) {
                profesoresMap.set(prof.id_profesor, {
                    id_profesor: prof.id_profesor,
                    profesor_nombre: prof.profesor_nombre,
                    materias: []
                });
            }
        });

        // Agregar profesores encontrados por materia
        (profesoresPorMateria || []).forEach(prof => {
            if (!profesoresMap.has(prof.id_profesor)) {
                profesoresMap.set(prof.id_profesor, {
                    id_profesor: prof.id_profesor,
                    profesor_nombre: prof.profesor_nombre,
                    materias: []
                });
            }
            // Agregar la materia a la lista
            if (prof.nombre_materia) {
                profesoresMap.get(prof.id_profesor).materias.push(prof.nombre_materia);
            }
        });

        if (profesoresMap.size === 0) {
            return { data: [], error: null };
        }

        // 4. Obtener ratings de todos los profesores
        const profesorIds = Array.from(profesoresMap.keys());
        const { data: ratings, error: ratingsError } = await supabase
            .from('rating')
            .select('ref_id, estrellas')
            .eq('tipo', 'profesor')
            .in('ref_id', profesorIds);

        if (ratingsError) {
            console.error('Error obteniendo ratings:', ratingsError);
        }

        // 5. Calcular promedio de ratings
        const ratingsMap = {};
        if (ratings && ratings.length > 0) {
            ratings.forEach(rating => {
                if (!ratingsMap[rating.ref_id]) {
                    ratingsMap[rating.ref_id] = { sum: 0, count: 0 };
                }
                ratingsMap[rating.ref_id].sum += rating.estrellas;
                ratingsMap[rating.ref_id].count += 1;
            });
        }

        // 6. Transformar resultados finales
        const transformed = Array.from(profesoresMap.values()).map(prof => {
            const ratingData = ratingsMap[prof.id_profesor];
            const avgRating = ratingData
                ? Number((ratingData.sum / ratingData.count).toFixed(1))
                : 0;

            return {
                id: prof.id_profesor,
                id_profesor: prof.id_profesor,
                profesor_nombre: prof.profesor_nombre,
                materia_nombre: prof.materias.join(', ') || '',
                rating_promedio: avgRating,
                estrellas: avgRating
            };
        });

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

        // Obtener IDs de materias encontradas
        const materiaIds = (materias || []).map(m => m.id_materia);

        if (materiaIds.length === 0) {
            return { data: [], error: null };
        }

        // Contar apuntes, profesores y mentores por materia
        const [apuntesCount, profesoresCount, mentoresCount] = await Promise.all([
            // Contar apuntes
            supabase
                .from('apunte')
                .select('id_materia')
                .in('id_materia', materiaIds),

            // Contar profesores
            supabase
                .from('imparte')
                .select('id_materia, id_profesor')
                .in('id_materia', materiaIds),

            // Contar mentores
            supabase
                .from('mentor_materia')
                .select('id_materia, id_mentor')
                .in('id_materia', materiaIds)
        ]);

        // Crear mapas de conteo
        const apuntesMap = {};
        const profesoresMap = {};
        const mentoresMap = {};

        (apuntesCount.data || []).forEach(item => {
            apuntesMap[item.id_materia] = (apuntesMap[item.id_materia] || 0) + 1;
        });

        (profesoresCount.data || []).forEach(item => {
            if (!profesoresMap[item.id_materia]) {
                profesoresMap[item.id_materia] = new Set();
            }
            profesoresMap[item.id_materia].add(item.id_profesor);
        });

        (mentoresCount.data || []).forEach(item => {
            if (!mentoresMap[item.id_materia]) {
                mentoresMap[item.id_materia] = new Set();
            }
            mentoresMap[item.id_materia].add(item.id_mentor);
        });

        const transformed = (materias || []).map(materia => ({
            id: materia.id_materia,
            id_materia: materia.id_materia,
            nombre_materia: materia.nombre_materia,
            semestre: materia.semestre || '',
            label: materia.nombre_materia,
            source: 'materia',
            total_apuntes: apuntesMap[materia.id_materia] || 0,
            total_profesores: profesoresMap[materia.id_materia]?.size || 0,
            total_mentores: mentoresMap[materia.id_materia]?.size || 0
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
        // 1️⃣ Buscar apuntes por TÍTULO
        const { data: apuntesPorTitulo, error: errorTitulo } = await supabase
            .rpc('buscar_apuntes_sin_tildes', { termino: q });

        if (errorTitulo) {
            console.error('Error buscando apuntes por título:', errorTitulo);
        }

        // 2️⃣ Buscar apuntes por NOMBRE DE MATERIA
        const { data: apuntesPorMateria, error: errorMateria } = await supabase
            .rpc('buscar_apuntes_por_materia', { termino: q });

        if (errorMateria) {
            console.error('Error buscando apuntes por materia:', errorMateria);
        }

        // 3️⃣ Combinar IDs únicos
        const idsSet = new Set();
        (apuntesPorTitulo || []).forEach(a => idsSet.add(a.id_apunte));
        (apuntesPorMateria || []).forEach(a => idsSet.add(a.id_apunte));

        if (idsSet.size === 0) {
            return { data: [], error: null };
        }

        const ids = Array.from(idsSet);

        // 4️⃣ Traer toda la info de esos apuntes
        const { data: apuntesCompletos, error: errorCompleto } = await supabase
            .from('apuntes_completos')
            .select('*')
            .in('id_apunte', ids);

        if (errorCompleto) {
            console.error('Error obteniendo apuntes completos:', errorCompleto);
            return { data: [], error: errorCompleto };
        }

        // 5️⃣ Contar likes por apunte
        const apunteIds = apuntesCompletos.map(a => a.id_apunte);
        const { data: likesData, error: likesError } = await supabase
            .from('likes')
            .select('id_apunte')
            .eq('tipo', 'like')
            .in('id_apunte', apunteIds);

        if (likesError) {
            console.error('Error cargando likes:', likesError);
        }

        // Crear mapa de conteo de likes
        const likesCountMap = {};
        likesData?.forEach(like => {
            likesCountMap[like.id_apunte] = (likesCountMap[like.id_apunte] || 0) + 1;
        });

        // 6️⃣ Obtener nombres de usuarios
        const userIds = [...new Set(apuntesCompletos.map(a => a.id_usuario))];
        const { data: usuarios } = await supabase
            .from('usuario')
            .select('id_usuario, nombre')
            .in('id_usuario', userIds);

        const userMap = new Map(usuarios?.map(u => [u.id_usuario, u.nombre]) || []);

        // 7️⃣ Transformar con signed URLs
        const transformed = [];
        for (const a of (apuntesCompletos || [])) {
            let signedUrl = null;

            if (a.file_path) {
                const { data: signedData, error: signedError } = await supabase.storage
                    .from('apuntes')
                    .createSignedUrl(a.file_path, 3600);

                if (!signedError && signedData) {
                    signedUrl = signedData.signedUrl;
                }
            }

            transformed.push({
                id: a.id_apunte,
                id_apunte: a.id_apunte,
                titulo: a.titulo,
                descripcion: a.descripcion || '',
                estrellas: a.estrellas || 0,
                creditos: a.creditos || 0,
                file_path: a.file_path,
                signedUrl: signedUrl,
                materia: { nombre_materia: a.materia_nombre },
                usuario: { nombre: a.autor_nombre || 'Anónimo' },
                likes_count: likesCountMap[a.id_apunte] || 0,
                thumbnail_path: a.thumbnail_path || null
            });
        }

        return { data: transformed, error: null };

    } catch (error) {
        console.error('Error en searchNotes:', error);
        return { data: [], error };
    }
}

async function searchUsers(term) {
    const q = (term || "").trim();
    if (!q) return { data: [], error: null };

    try {
        const { data: miIdData } = await supabase.rpc('obtener_usuario_actual_id');
        const miId = miIdData || null;

        const { data, error } = await supabase
            .rpc('buscar_usuarios_sin_tildes', { termino: q });

        if (error) {
            console.error('Error buscando usuarios:', error);
            return { data: [], error };
        }

        // Filtrar mi usuario Y usuarios que son mentores
        const { data: mentores } = await supabase
            .from('mentor')
            .select('id_usuario');

        const mentorUserIds = new Set(mentores?.map(m => m.id_usuario) || []);

        const usuariosFiltrados = (data || []).filter(usuario => {
            const noEsMiUsuario = miId ? usuario.id_usuario !== miId : true;
            const noEsMentor = !mentorUserIds.has(usuario.id_usuario);
            return noEsMiUsuario && noEsMentor;
        });

        // ✨ NUEVO: Obtener quiénes estoy siguiendo
        let siguiendoSet = new Set();
        if (miId && usuariosFiltrados.length > 0) {
            const userIds = usuariosFiltrados.map(u => u.id_usuario);
            const { data: seguimientos } = await supabase
                .from('seguidores')
                .select('seguido_id')
                .eq('seguidor_id', miId)
                .eq('estado', 'activo')
                .in('seguido_id', userIds);

            siguiendoSet = new Set(seguimientos?.map(s => s.seguido_id) || []);
        }

        const transformed = usuariosFiltrados.map(usuario => ({
            id: usuario.id_usuario,
            id_usuario: usuario.id_usuario,
            nombre: usuario.nombre,
            foto: usuario.foto,
            username: usuario.username,
            tipo: 'usuario',
            label: usuario.nombre,
            siguiendo: siguiendoSet.has(usuario.id_usuario)
        }));

        return { data: transformed, error: null };

    } catch (error) {
        console.error('Error en searchUsers:', error);
        return { data: [], error };
    }
}

async function searchMentors(term) {
    const q = (term || "").trim();
    if (!q) return { data: [], error: null };


    try {
        const { data: miIdData } = await supabase.rpc('obtener_usuario_actual_id');
        const miId = miIdData || null;

        // 1. Buscar mentores por NOMBRE
        const { data: mentoresPorNombre, error: errorNombre } = await supabase
            .rpc('buscar_mentores_sin_tildes', { termino: q });


        if (errorNombre) {
            console.error('Error buscando mentores por nombre:', errorNombre);
        }

        // 2. Buscar mentores por MATERIA
        const { data: mentoresPorMateria, error: errorMateria } = await supabase
            .rpc('buscar_mentores_por_materia', { termino: q });

        if (errorMateria) {
            console.error('Error buscando mentores por materia:', errorMateria);
        }

        // 3. Combinar resultados (evitar duplicados)
        const mentoresMap = new Map();

        // Agregar mentores encontrados por nombre
        (mentoresPorNombre || []).forEach(mentor => {
            if (!mentoresMap.has(mentor.id_mentor)) {
                mentoresMap.set(mentor.id_mentor, {
                    id_mentor: mentor.id_mentor,
                    nombre: mentor.nombre,
                    username: mentor.username,
                    foto: mentor.foto,
                    estrellas_mentor: mentor.estrellas_mentor,
                    materias: []
                });
            }
        });

        // Agregar mentores encontrados por materia
        (mentoresPorMateria || []).forEach(mentor => {
            if (!mentoresMap.has(mentor.id_mentor)) {
                mentoresMap.set(mentor.id_mentor, {
                    id_mentor: mentor.id_mentor,
                    nombre: mentor.nombre,
                    username: mentor.username,
                    foto: mentor.foto,
                    estrellas_mentor: mentor.estrellas_mentor,
                    materias: []
                });
            }
            // Agregar la materia a la lista
            if (mentor.nombre_materia) {
                mentoresMap.get(mentor.id_mentor).materias.push(mentor.nombre_materia);
            }
        });

        if (mentoresMap.size === 0) {
            return { data: [], error: null };
        }

        // 4. Obtener id_usuario de cada mentor y filtrar seguimientos
        const mentorIds = Array.from(mentoresMap.keys());
        const { data: mentorUsers } = await supabase
            .from('mentor')
            .select('id_mentor, id_usuario')
            .in('id_mentor', mentorIds);

        const userMap = new Map(mentorUsers?.map(m => [m.id_mentor, m.id_usuario]) || []);

        // 5. Obtener quiénes estoy siguiendo
        let siguiendoSet = new Set();
        if (miId && mentorUsers && mentorUsers.length > 0) {
            const userIds = mentorUsers.map(m => m.id_usuario);
            const { data: seguimientos } = await supabase
                .from('seguidores')
                .select('seguido_id')
                .eq('seguidor_id', miId)
                .eq('estado', 'activo')
                .in('seguido_id', userIds);

            siguiendoSet = new Set(seguimientos?.map(s => s.seguido_id) || []);
        }

// 6. Transformar resultados finales
        const transformed = Array.from(mentoresMap.values()).map(m => {
            const userId = userMap.get(m.id_mentor) || null;
            return {
                id: m.id_mentor,
                id_mentor: m.id_mentor,
                id_usuario: userId,
                mentor_nombre: m.nombre || 'Mentor',
                mentor_correo: '',
                username: m.username,
                foto: m.foto,
                estrellas_mentor: m.estrellas_mentor,
                rating_promedio: m.estrellas_mentor,
                contacto: '',
                siguiendo: userId ? siguiendoSet.has(userId) : false
            };
        });


        return { data: transformed, error: null };

    } catch (error) {
        console.error('Error en searchMentors:', error);
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
            // Obtener mentor_materia sin el JOIN
            const { data: mentorMaterias } = await supabase
                .from('mentor_materia')
                .select('id, id_materia')
                .eq('id_mentor', data.id_mentor)

            // Obtener los datos de las materias por separado
            if (mentorMaterias && mentorMaterias.length > 0) {
                const materiaIds = mentorMaterias.map(mm => mm.id_materia)

                const { data: materias } = await supabase
                    .from('materia')
                    .select('id_materia, nombre_materia, semestre')
                    .in('id_materia', materiaIds)

                // Combinar los datos
                data.mentor_materia = mentorMaterias.map(mm => ({
                    ...mm,
                    materia: materias?.find(m => m.id_materia === mm.id_materia) || null
                }))
            } else {
                data.mentor_materia = []
            }
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
            .select('*, thumbnail_path, materia(nombre_materia)')
            .ilike('titulo', `%${searchTerm}%`)

        return { data, error }
    },

    async getNotesBySubject(materiaId) {
        const { data, error } = await supabase
            .from('apunte')
            .select('*, thumbnail_path')
            .eq('id_materia', materiaId)

        return { data, error }
    },

    // ==========================================
    // ❤️ SISTEMA DE LIKES
    // ==========================================

    /**
     * Toggle like/unlike en un apunte
     * @param {number} apunteId - ID del apunte
     * @returns {Object} { data: { liked: boolean, count: number }, error }
     */
    async toggleLike(apunteId) {
        try {
            // 1. Obtener usuario actual
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return {
                    data: null,
                    error: { message: 'Debes iniciar sesión para dar like' }
                };
            }

            const { data: usuarioData, error: userError } = await supabase
                .from('usuario')
                .select('id_usuario')
                .eq('auth_id', user.id)
                .single();

            if (userError || !usuarioData) {
                return {
                    data: null,
                    error: { message: 'Usuario no encontrado' }
                };
            }

            const userId = usuarioData.id_usuario;

            // 2. Verificar si ya dio like
            const { data: existingLike, error: checkError } = await supabase
                .from('likes')
                .select('*')
                .eq('id_usuario', userId)
                .eq('id_apunte', apunteId)
                .eq('tipo', 'like')
                .maybeSingle();

            if (checkError) {
                console.error('Error verificando like:', checkError);
                return { data: null, error: checkError };
            }

            let liked = false;

            if (existingLike) {
                // 3A. Ya dio like → eliminar (unlike)
                const { error: deleteError } = await supabase
                    .from('likes')
                    .delete()
                    .eq('id_usuario', userId)
                    .eq('id_apunte', apunteId);

                if (deleteError) {
                    console.error('Error eliminando like:', deleteError);
                    return { data: null, error: deleteError };
                }

                liked = false;
            } else {
                // 3B. No dio like → insertar (like)
                const { error: insertError } = await supabase
                    .from('likes')
                    .insert([{
                        id_usuario: userId,
                        id_apunte: apunteId,
                        tipo: 'like'
                    }]);

                if (insertError) {
                    console.error('Error insertando like:', insertError);
                    return { data: null, error: insertError };
                }

                liked = true;

                // 🎁 Verificar bonos por likes del autor del apunte
                try {
                    const { data: apunteData } = await supabase
                        .from('apunte')
                        .select('id_usuario')
                        .eq('id_apunte', apunteId)
                        .single();

                    if (apunteData) {
                        // Importar creditsAPI si no está disponible
                        const { data: bonusResult } = await creditsAPI.checkAndGrantLikesBonus(apunteData.id_usuario);

                        if (bonusResult?.bonosOtorgados?.length > 0) {
                            bonusResult.bonosOtorgados.forEach(bono => {
                                console.log(`🎉 ¡El autor alcanzó un hito! ${bono.hito} likes = +${bono.creditos} créditos`);
                            });
                        }
                    }
                } catch (bonusError) {
                    console.error('Error verificando bonos de likes:', bonusError);
                    // No fallar el like si falla el bono
                }
            }

            // 4. Obtener nuevo conteo
            const { count, error: countError } = await supabase
                .from('likes')
                .select('*', { count: 'exact', head: true })
                .eq('id_apunte', apunteId)
                .eq('tipo', 'like');

            if (countError) {
                console.error('Error contando likes:', countError);
            }

            return {
                data: {
                    liked,
                    count: count || 0
                },
                error: null
            };

        } catch (error) {
            console.error('Error en toggleLike:', error);
            return { data: null, error };
        }
    },

    /**
     * Verificar si el usuario actual dio like a un apunte
     * @param {number} apunteId - ID del apunte
     * @returns {Object} { data: boolean, error }
     */
    async checkIfLiked(apunteId) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { data: false, error: null };
            }

            const { data: usuarioData, error: userError } = await supabase
                .from('usuario')
                .select('id_usuario')
                .eq('auth_id', user.id)
                .single();

            if (userError || !usuarioData) {
                return { data: false, error: null };
            }

            const { data, error } = await supabase
                .from('likes')
                .select('*')
                .eq('id_usuario', usuarioData.id_usuario)
                .eq('id_apunte', apunteId)
                .eq('tipo', 'like')
                .maybeSingle();

            return { data: !!data, error };

        } catch (error) {
            console.error('Error en checkIfLiked:', error);
            return { data: false, error };
        }
    },

    /**
     * Obtener conteo de likes de un apunte
     * @param {number} apunteId - ID del apunte
     * @returns {Object} { data: number, error }
     */
    async getLikesCount(apunteId) {
        try {
            const { count, error } = await supabase
                .from('likes')
                .select('*', { count: 'exact', head: true })
                .eq('id_apunte', apunteId)
                .eq('tipo', 'like');

            return { data: count || 0, error };

        } catch (error) {
            console.error('Error en getLikesCount:', error);
            return { data: 0, error };
        }
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

// ==========================================
// 🔔 NOTIFICACIONES (DEFINIDO ANTES QUE FOLLOWERS)
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

// ==========================================
// ⭐ RATINGS (MODIFICADO PARA SOPORTAR PROFESOR/MENTOR/MATERIA)
// ==========================================



export const ratingsAPI = {
    async createRating(tipo, refId, estrellas, comentario, extra = {}) {
        const {data: authData, error: authErr} = await supabase.auth.getUser();
        const user = authData?.user;
        if (authErr || !user) {
            return {data: null, error: {message: "Debes iniciar sesión para reseñar."}};
        }

        const {data: usuarioData, error: usuarioError} = await supabase
            .from('usuario')
            .select('id_usuario')
            .eq('auth_id', user.id)
            .single();

        if (usuarioError || !usuarioData) {
            return {data: null, error: {message: "Usuario no encontrado en la base de datos."}};
        }

        // ✅ VALIDAR PALABRAS PROHIBIDAS
        const validacion = validarComentario(comentario);
        if (!validacion.valido) {
            console.warn('⚠️ Comentario bloqueado por contenido inapropiado');
            return {data: null, error: {message: validacion.error}};
        }

        const refIdAsInt = parseInt(refId, 10);

        if (isNaN(refIdAsInt)) {
            return {data: null, error: {message: "ID inválido para la entidad calificada."}};
        }

        const payload = {
            tipo: tipo,
            ref_id: refIdAsInt,
            estrellas: estrellas,
            comentario: comentario?.trim() || null,
            workload: extra.workload || null,
            materia_id: extra.materia_id ? parseInt(extra.materia_id, 10) : null,
            user_id: usuarioData.id_usuario,
            tags: extra.tags || []
        };

        console.log('📝 Payload de rating:', payload);

        const {data, error} = await supabase
            .from('rating')
            .insert(payload)
            .select()
            .single();

        if (error) {
            console.error('❌ Error al crear rating:', error);
        } else {
            console.log('✅ Rating creado:', data);
        }

        return {data, error};
    },

    async listByMateria(materiaId) {
        return await supabase
            .from('rating')
            .select('id, estrellas, comentario, workload, user_id, created_at, tags')
            .eq('tipo','materia')
            .eq('ref_id', materiaId)
            .order('created_at', { ascending: false });
    },

    async listByProfesor(profesorId) {
        return await supabase
            .from('rating')
            .select('id, estrellas, comentario, workload, materia_id, user_id, created_at, tags')
            .eq('tipo', 'profesor')
            .eq('ref_id', profesorId)
            .order('created_at', { ascending: false });
    },

    async listByMentor(mentorId) {
        return await supabase
            .from('rating')
            .select('id, estrellas, comentario, workload, materia_id, user_id, created_at, tags')
            .eq('tipo', 'mentor')
            .eq('ref_id', mentorId)
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
    },

    async getAverageForProfesor(profesorId) {
        const { data, error } = await supabase
            .from('rating')
            .select('estrellas', { count: 'exact' })
            .eq('tipo', 'profesor')
            .eq('ref_id', profesorId);

        if (error) return { data: null, error };
        const count = data?.length || 0;
        const sum = (data || []).reduce((a, r) => a + (r.estrellas || 0), 0);
        return { data: { count, avg: count ? +(sum / count).toFixed(2) : 0 }, error: null };
    },

    async getAverageForMentor(mentorId) {
        const { data, error } = await supabase
            .from('rating')
            .select('estrellas', { count: 'exact' })
            .eq('tipo', 'mentor')
            .eq('ref_id', mentorId);

        if (error) return { data: null, error };
        const count = data?.length || 0;
        const sum = (data || []).reduce((a, r) => a + (r.estrellas || 0), 0);
        return { data: { count, avg: count ? +(sum / count).toFixed(2) : 0 }, error: null };
    },

    async deleteRating(ratingId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { data: null, error: 'No hay usuario logueado' };

        const { data: usuarioData } = await supabase
            .from('usuario')
            .select('id_usuario')
            .eq('auth_id', user.id)
            .single();

        if (!usuarioData) return { data: null, error: 'Usuario no encontrado' };

        const { data: rating } = await supabase
            .from('rating')
            .select('user_id, created_at')
            .eq('id', ratingId)
            .single();

        if (!rating) return { data: null, error: 'Reseña no encontrada' };

        if (rating.user_id !== usuarioData.id_usuario) {
            return { data: null, error: 'No tienes permiso para borrar esta reseña' };
        }

        const createdAt = new Date(rating.created_at);
        const now = new Date();
        const hoursDiff = (now - createdAt) / (1000 * 60 * 60);

        if (hoursDiff > 24) {
            return { data: null, error: 'Solo puedes borrar reseñas dentro de las primeras 24 horas' };
        }

        const { data, error } = await supabase
            .from('rating')
            .delete()
            .eq('id', ratingId)
            .select();

        return { data, error };
    },
    async updateRating(ratingId, estrellas, comentario, extra = {}) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { data: null, error: 'No hay usuario logueado' };

        const { data: usuarioData } = await supabase
            .from('usuario')
            .select('id_usuario')
            .eq('auth_id', user.id)
            .single();

        if (!usuarioData) return { data: null, error: 'Usuario no encontrado' };

        // Verificar que la reseña pertenece al usuario
        const { data: rating } = await supabase
            .from('rating')
            .select('user_id')
            .eq('id', ratingId)
            .single();

        if (!rating || rating.user_id !== usuarioData.id_usuario) {
            return { data: null, error: 'No tienes permiso para editar esta reseña' };
        }

        // Validar palabras prohibidas
        const validacion = validarComentario(comentario);
        if (!validacion.valido) {
            return { data: null, error: { message: validacion.error } };
        }

        const payload = {
            estrellas,
            comentario: comentario?.trim() || null,
            workload: extra.workload || null,
            tags: extra.tags || []
        };

        // ✅ AGREGAR ESTA LÍNEA: Permitir actualizar materia_id si viene en extra
        if (extra.materia_id) {
            payload.materia_id = extra.materia_id;
        }

        const { data, error } = await supabase
            .from('rating')
            .update(payload)
            .eq('id', ratingId)
            .select()
            .single();

        return { data, error };
    },

    async getMyRatings() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { data: null, error: 'No hay usuario logueado' };

        const { data: usuarioData } = await supabase
            .from('usuario')
            .select('id_usuario')
            .eq('auth_id', user.id)
            .single();

        if (!usuarioData) return { data: null, error: 'Usuario no encontrado' };

        const { data, error } = await supabase
            .from('rating')
            .select(`
            id,
            tipo,
            ref_id,
            estrellas,
            comentario,
            workload,
            materia_id,
            created_at,
            tags,
            materia:materia_id(id_materia, nombre_materia)
        `)
            .eq('user_id', usuarioData.id_usuario)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Error obteniendo ratings:', error);
            return { data: null, error };
        }

        // Separar IDs por tipo
        const profesorIds = data.filter(r => r.tipo === 'profesor').map(r => r.ref_id);
        const mentorIds = data.filter(r => r.tipo === 'mentor').map(r => r.ref_id);

        let profesoresMap = new Map();
        let mentoresMap = new Map();

        // Obtener nombres de PROFESORES
        if (profesorIds.length > 0) {
            const { data: profData, error: profError } = await supabase
                .from('profesor_curso')
                .select('id_profesor, profesor_nombre')
                .in('id_profesor', profesorIds);

            if (profError) {
                console.error('❌ Error obteniendo profesores:', profError);
            } else {
                console.log('✅ Profesores obtenidos:', profData);
                profData?.forEach(p => {
                    profesoresMap.set(p.id_profesor, p.profesor_nombre);
                });
            }
        }

        // ✅ AQUÍ ESTÁ EL CAMBIO PRINCIPAL - Obtener nombres de MENTORES
        if (mentorIds.length > 0) {
            const { data: mentorData, error: mentorError } = await supabase
                .from('mentor')
                .select('id_mentor, id_usuario')
                .in('id_mentor', mentorIds);

            if (mentorError) {
                console.error('❌ Error obteniendo mentores:', mentorError);
            } else {
                console.log('✅ Mentores obtenidos (con id_usuario):', mentorData);

                // Ahora obtener los nombres de usuario usando id_usuario
                if (mentorData && mentorData.length > 0) {
                    const userIds = mentorData.map(m => m.id_usuario);

                    const { data: usuariosData, error: usuariosError } = await supabase
                        .from('usuario')
                        .select('id_usuario, nombre')
                        .in('id_usuario', userIds);

                    if (usuariosError) {
                        console.error('❌ Error obteniendo nombres de usuarios:', usuariosError);
                    } else {
                        console.log('✅ Nombres de usuarios obtenidos:', usuariosData);

                        // Crear un mapa de id_usuario -> nombre
                        const usuariosNombresMap = new Map(
                            usuariosData?.map(u => [u.id_usuario, u.nombre]) || []
                        );

                        // Mapear id_mentor -> nombre usando ambos mapas
                        mentorData.forEach(m => {
                            const nombre = usuariosNombresMap.get(m.id_usuario) || 'Mentor desconocido';
                            mentoresMap.set(m.id_mentor, nombre);
                        });
                    }
                }
            }
        }

        // Combinar datos con nombres
        const ratingsConNombres = data.map(rating => {
            let nombre = 'Desconocido';

            if (rating.tipo === 'profesor') {
                nombre = profesoresMap.get(rating.ref_id) || 'Profesor desconocido';
            } else if (rating.tipo === 'mentor') {
                nombre = mentoresMap.get(rating.ref_id) || 'Mentor desconocido';
            }

            return {
                ...rating,
                nombre_entidad: nombre
            };
        });

        console.log('✅ Ratings finales con nombres:', ratingsConNombres);

        return { data: ratingsConNombres, error: null };
    }
}
// ==========================================
// 👨‍🏫 PROFESORES
// ==========================================
export const professorAPI = {
    async getAllProfessors() {
        // 1. Traer profesores con materias
        const {data: profesores, error} = await supabase
            .from('profesor_curso')
            .select(`
            *,
            imparte(materia(id_materia, nombre_materia))
        `)

        if (error) return {data: null, error}

        // 2. Traer ratings de todos los profesores
        const profesorIds = profesores.map(p => p.id_profesor)
        const {data: ratings} = await supabase
            .from('rating')
            .select('ref_id, estrellas')
            .eq('tipo', 'profesor')
            .in('ref_id', profesorIds)

        // 3. Calcular promedio y agregar a cada profesor
        const ratingsMap = {}
        ratings?.forEach(r => {
            if (!ratingsMap[r.ref_id]) ratingsMap[r.ref_id] = {sum: 0, count: 0}
            ratingsMap[r.ref_id].sum += r.estrellas
            ratingsMap[r.ref_id].count += 1
        })

        const profesoresConRating = profesores.map(prof => {
            const ratingData = ratingsMap[prof.id_profesor]
            const avgRating = ratingData
                ? Number((ratingData.sum / ratingData.count).toFixed(1))
                : 0

            return {
                ...prof,
                rating_promedio: avgRating,
                total_resenas: ratingData?.count || 0,
                materias: prof.imparte?.map(i => i.materia?.nombre_materia).filter(Boolean) || []
            }
        })

        return {data: profesoresConRating, error: null}
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
// 👤 PERFIL PÚBLICO
// ==========================================
export const publicProfileAPI = {
    async getPublicProfile(username) {
        const { data, error } = await supabase
            .from('usuario')
            .select(`
                    id_usuario,
                    nombre,
                    username,
                    foto,
                    correo,
                    perfil_publico,
                    mostrar_email,
                    fecha_creado,
                    bio,
                    linkedin
                `)
            .eq('username', username.toLowerCase())
            .maybeSingle();

        if (error) return { data: null, error };
        if (!data) return { data: null, error: { message: 'Usuario no encontrado' } };

        if (!data.perfil_publico) {
            return { data: null, error: { message: 'Este perfil es privado' } };
        }

        return { data, error: null };
    },

    async getPublicStats(userId) {
        try {
            const { count: apuntesCount } = await supabase
                .from('apunte')
                .select('*', { count: 'exact', head: true })
                .eq('id_usuario', userId);

            const { count: resenasCount } = await supabase
                .from('rating')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);

            const { count: seguidoresCount } = await supabase
                .from('seguidores')
                .select('*', { count: 'exact', head: true })
                .eq('seguido_id', userId)
                .eq('estado', 'activo');

            const { count: siguiendoCount } = await supabase
                .from('seguidores')
                .select('*', { count: 'exact', head: true })
                .eq('seguidor_id', userId)
                .eq('estado', 'activo');

            return {
                data: {
                    apuntes: apuntesCount || 0,
                    resenas: resenasCount || 0,
                    seguidores: seguidoresCount || 0,
                    siguiendo: siguiendoCount || 0
                },
                error: null
            };
        } catch (error) {
            console.error('Error obteniendo stats:', error);
            return { data: null, error };
        }
    },

    async checkIfMentor(userId) {
        const { data, error } = await supabase
            .from('mentor')
            .select(`
                id_mentor,
                estrellas_mentor,
                contacto,
                descripcion
            `)
            .eq('id_usuario', userId)
            .maybeSingle();

        if (error) return { data: null, error };

        if (data) {
            const { data: materias } = await supabase
                .from('mentor_materia')
                .select(`
                    id_materia,
                    materia(nombre_materia, semestre)
                `)
                .eq('id_mentor', data.id_mentor);

            data.materias = materias || [];
        }

        return { data, error: null };
    },

    async getRecentNotes(userId, limit = 4) {
        const { data, error } = await supabase
            .from('apuntes_completos')
            .select('*')
            .eq('id_usuario', userId)
            .order('created_at', { ascending: false })
            .limit(limit);
        if (error) return { data: null, error };

        // Contar likes para cada apunte
        const apIds = (data || []).map(n => n.id_apunte);
        let likesCountMap = {};

        if (apIds.length > 0) {
            const { data: likesData, error: likesError } = await supabase
                .from('likes')
                .select('id_apunte')
                .eq('tipo', 'like')
                .in('id_apunte', apIds);

            if (likesError) {
                console.error('Error cargando likes:', likesError);
            }

            likesData?.forEach(like => {
                likesCountMap[like.id_apunte] = (likesCountMap[like.id_apunte] || 0) + 1;
            });
        }

        // Agregar likes_count a cada apunte
        const notesWithLikes = (data || []).map(note => ({
            ...note,
            usuario: { nombre: note.autor_nombre },
            materia: { nombre_materia: note.materia_nombre },
            likes_count: likesCountMap[note.id_apunte] || 0
        }));

        return { data: notesWithLikes, error: null };
    },

    async getAllNotes(userId, materiaId = null) {
        let query = supabase
            .from('apuntes_completos')
            .select('*')
            .eq('id_usuario', userId)
            .order('created_at', { ascending: false });
        if (materiaId) {
            query = query.eq('id_materia', materiaId);
        }

        const { data, error } = await query;

        if (error) return { data: null, error };

        // Contar likes para cada apunte
        const apIds = (data || []).map(n => n.id_apunte);
        let likesCountMap = {};

        if (apIds.length > 0) {
            const { data: likesData, error: likesError } = await supabase
                .from('likes')
                .select('id_apunte')
                .eq('tipo', 'like')
                .in('id_apunte', apIds);

            if (likesError) {
                console.error('Error cargando likes:', likesError);
            }

            likesData?.forEach(like => {
                likesCountMap[like.id_apunte] = (likesCountMap[like.id_apunte] || 0) + 1;
            });
        }

        // Agregar likes_count a cada apunte
        const notesWithLikes = (data || []).map(note => ({
            ...note,
            usuario: { nombre: note.autor_nombre },
            materia: { nombre_materia: note.materia_nombre },
            likes_count: likesCountMap[note.id_apunte] || 0
        }));

        return { data: notesWithLikes, error: null };
    },

    async getUserSubjects(userId) {
        const { data, error } = await supabase
            .from('apunte')
            .select(`
                id_materia,
                materia(id_materia, nombre_materia),
                thumbnail_path
            `)
            .eq('id_usuario', userId);

        if (error) return { data: [], error };

        const uniqueSubjects = [];
        const seenIds = new Set();

        (data || []).forEach(item => {
            if (item.materia && !seenIds.has(item.materia.id_materia)) {
                seenIds.add(item.materia.id_materia);
                uniqueSubjects.push(item.materia);
            }
        });

        return { data: uniqueSubjects, error: null };
    },

    async getUserReviews(userId, limit = 10) {
        const { data, error } = await supabase
            .from('rating')
            .select(`
                id,
                tipo,
                ref_id,
                estrellas,
                comentario,
                titulo,
                created_at,
                materia_id
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        return { data, error };
    },

    async isFollowing(targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { data: false, error: null };

        const { data: currentUser } = await supabase
            .from('usuario')
            .select('id_usuario')
            .eq('auth_id', user.id)
            .single();

        if (!currentUser) return { data: false, error: null };

        const { data, error } = await supabase
            .from('seguidores')
            .select('id')
            .eq('seguidor_id', currentUser.id_usuario)
            .eq('seguido_id', targetUserId)
            .eq('estado', 'activo')
            .maybeSingle();

        return { data: !!data, error };
    },
    getMentorCalendly: async (userId) => {
        try {
            const { data, error } = await supabase
                .from('mentores')
                .select('url_calendly')
                .eq('id_usuario', userId)
                .single();

            if (error) throw error;
            return { data: data?.url_calendly || null, error: null };
        } catch (error) {
            console.error('Error obteniendo Calendly del mentor:', error);
            return { data: null, error };
        }
    }
};

// ==========================================
// 📁 CARPETAS DE COMPRAS
// ==========================================
export const foldersAPI = {
    async getMyFolders() {
        const {data: {user}} = await supabase.auth.getUser()
        if (!user) return {data: null, error: 'No hay usuario logueado'}

        const {data: usuarioData} = await supabase
            .from('usuario')
            .select('id_usuario')
            .eq('auth_id', user.id)
            .single()

        if (!usuarioData) return {data: null, error: 'Usuario no encontrado'}

        const {data, error} = await supabase
            .from('carpeta_compras')
            .select('*')
            .eq('comprador_id', usuarioData.id_usuario)
            .order('orden', {ascending: true})

        return {data, error}
    },

    async createFolder(nombre, tipo = 'personalizada', parentId = null, orden = 0) {
        const {data: {user}} = await supabase.auth.getUser()
        if (!user) return {data: null, error: 'No hay usuario logueado'}

        const {data: usuarioData} = await supabase
            .from('usuario')
            .select('id_usuario')
            .eq('auth_id', user.id)
            .single()

        if (!usuarioData) return {data: null, error: 'Usuario no encontrado'}

        const {data, error} = await supabase
            .from('carpeta_compras')
            .insert([{
                comprador_id: usuarioData.id_usuario,
                nombre,
                tipo,
                parent_id: parentId,
                orden
            }])
            .select()
            .single()

        return {data, error}
    },

    async updateFolder(carpetaId, nuevoNombre) {
        const {data, error} = await supabase
            .from('carpeta_compras')
            .update({nombre: nuevoNombre})
            .eq('id_carpeta', carpetaId)
            .select()
            .single()

        return {data, error}
    },

    async deleteFolder(carpetaId) {
        const {data, error} = await supabase
            .from('carpeta_compras')
            .delete()
            .eq('id_carpeta', carpetaId)

        return {data, error}
    },

    async moveFolder(carpetaId, nuevoParentId, nuevoOrden) {
        const {data, error} = await supabase
            .from('carpeta_compras')
            .update({
                parent_id: nuevoParentId,
                orden: nuevoOrden
            })
            .eq('id_carpeta', carpetaId)
            .select()
            .single()

        return {data, error}
    },

    async getNotesInFolder(carpetaId) {
        const {data, error} = await supabase
            .from('apunte_en_carpeta')
            .select(`
                *,
                compra:compra_apunte(
                    id,
                    apunte_id,
                    creado_en
                )
            `)
            .eq('carpeta_id', carpetaId)
            .order('agregado_en', {ascending: false})

        return {data, error}
    },

    async addNoteToFolder(carpetaId, compraId) {
        const {data, error} = await supabase
            .from('apunte_en_carpeta')
            .insert([{
                carpeta_id: carpetaId,
                compra_id: compraId
            }])
            .select()
            .single()

        return {data, error}
    },

    async removeNoteFromFolder(carpetaId, compraId) {
        const {data, error} = await supabase
            .from('apunte_en_carpeta')
            .delete()
            .eq('carpeta_id', carpetaId)
            .eq('compra_id', compraId)

        return {data, error}
    },

    async moveNoteBetweenFolders(compraId, carpetaOrigenId, carpetaDestinoId) {
        await this.removeNoteFromFolder(carpetaOrigenId, compraId)
        return await this.addNoteToFolder(carpetaDestinoId, compraId)
    },

    async autoOrganize() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { data: null, error: 'No hay usuario logueado' }

        const { data: usuarioData } = await supabase
            .from('usuario')
            .select('id_usuario')
            .eq('auth_id', user.id)
            .single()

        if (!usuarioData) return { data: null, error: 'Usuario no encontrado' }

        try {
            const { data: compras, error: comprasError } = await supabase
                .from('compra_apunte')
                .select(`
                id,
                apunte_id,
                apunte:apunte!inner(
                    materia:materia!inner(
                        id_materia,
                        nombre_materia,
                        semestre
                    )
                )
            `)
                .eq('comprador_id', usuarioData.id_usuario)

            if (comprasError) {
                console.error('❌ Error obteniendo compras:', comprasError)
                throw comprasError
            }

            if (!compras || compras.length === 0) {
                return { data: { carpetasCreadas: 0 }, error: null }
            }

            const estructura = {}

            compras.forEach(compra => {
                const materia = compra.apunte?.materia
                if (!materia || !materia.semestre) {
                    console.log('⚠️ Compra sin materia/semestre:', compra.id)
                    return
                }

                const semestreNum = materia.semestre
                const semestreNombre = `Semestre ${semestreNum}`
                const nombreMateria = materia.nombre_materia


                if (!estructura[semestreNombre]) {
                    estructura[semestreNombre] = {}
                }

                if (!estructura[semestreNombre][nombreMateria]) {
                    estructura[semestreNombre][nombreMateria] = {
                        compras: []
                    }
                }

                estructura[semestreNombre][nombreMateria].compras.push(compra.id)
            })


            const carpetasCreadas = []
            const carpetasExistentes = {} // ✅ NUEVO: Cache de carpetas creadas

            for (const [nombreSemestre, materias] of Object.entries(estructura)) {

                // ✅ NUEVO: Verificar si ya existe una carpeta con ese nombre
                let carpetaSemestre = carpetasExistentes[nombreSemestre]

                if (!carpetaSemestre) {
                    const { data, error: errorSemestre } = await this.createFolder(
                        nombreSemestre,
                        'semestre',
                        null,
                        0
                    )

                    if (errorSemestre) {
                        console.error(`❌ Error creando carpeta semestre "${nombreSemestre}":`, errorSemestre)
                        continue
                    }

                    carpetaSemestre = data
                    carpetasExistentes[nombreSemestre] = data // ✅ Cachear
                    carpetasCreadas.push(data)
                } else {
                    console.log(`ℹ️ Carpeta "${nombreSemestre}" ya existe, reutilizando`)
                }

                if (!carpetaSemestre) continue

                for (const [nombreMateria, datos] of Object.entries(materias)) {

                    const { data: carpetaMateria } = await this.createFolder(
                        nombreMateria,
                        'materia',
                        carpetaSemestre.id_carpeta,
                        0
                    )

                    if (!carpetaMateria) continue

                    carpetasCreadas.push(carpetaMateria)

                    // Agregar apuntes tanto a materia como a semestre
                    for (const compraId of datos.compras) {
                        await this.addNoteToFolder(carpetaMateria.id_carpeta, compraId)
                    }
                }
            }


            return {
                data: {
                    carpetasCreadas: carpetasCreadas.length,
                    estructura
                },
                error: null
            }

        } catch (error) {
            console.error('❌ Error en organización automática:', error)
            return { data: null, error }
        }
    }
}

// ==========================================
// 💰 CRÉDITOS Y BONIFICACIONES
// ==========================================
export const creditsAPI = {
    // Obtener créditos actuales del usuario
    async getUserCredits() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { data: null, error: 'No hay usuario logueado' }

        const { data, error } = await supabase
            .from('usuario')
            .select('creditos')
            .eq('auth_id', user.id)
            .single()

        return { data: data?.creditos || 0, error }
    },

    // Agregar créditos al usuario
    async addCredits(amount, reason = 'manual', referenciaId = null) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { data: null, error: 'No hay usuario logueado' }

        // Primero obtenemos los créditos actuales
        const { data: userData, error: getUserError } = await supabase
            .from('usuario')
            .select('creditos, id_usuario')
            .eq('auth_id', user.id)
            .single()

        if (getUserError) return { data: null, error: getUserError }

        const newCredits = (userData.creditos || 0) + amount

        // Actualizamos los créditos
        const { data, error } = await supabase
            .from('usuario')
            .update({ creditos: newCredits })
            .eq('auth_id', user.id)
            .select()

        if (error) return { data: null, error }

        // Registrar en historial de transacciones
        const historialData = {
            id_usuario: userData.id_usuario,
            cantidad_creditos: amount,
            tipo_transaccion: reason,
            descripcion: reason,
            referencia_id: referenciaId
        };

        await supabase.from('historial_creditos').insert(historialData)

        return { data, error: null }
    },

    // Restar créditos al usuario
    async deductCredits(amount, reason = 'purchase') {
        return this.addCredits(-amount, reason)
    },

    // Calcular créditos por subir apunte
    async calculateNoteCredits(numPaginas, materiaId) {
        try {
            // Valor base: 10 créditos por página
            let creditos = numPaginas * 10

            // Obtener cantidad de apuntes en esa materia para aplicar multiplicador
            const { count, error } = await supabase
                .from('apunte')
                .select('id_apunte', { count: 'exact', head: true })
                .eq('id_materia', materiaId)

            if (!error) {
                if (count === 0) {
                    // Primera contribución: multiplicador x2
                    creditos *= 2
                } else if (count < 5) {
                    // Menos de 5 apuntes: multiplicador x1.5
                    creditos *= 1.5
                }
            }

            // El usuario recibe el 80% inmediato
            const creditosInmediatos = Math.floor(creditos * 0.8)
            const creditosBonos = creditos - creditosInmediatos

            return {
                data: {
                    creditosInmediatos,
                    creditosBonos,
                    creditosTotales: creditos,
                    multiplicador: creditos / (numPaginas * 10)
                },
                error: null
            }
        } catch (error) {
            return { data: null, error }
        }
    },

    // Otorgar créditos por subir apunte
    async grantNoteUploadCredits(apunteId, numPaginas, materiaId) {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return { data: null, error: 'No hay usuario logueado' }

            // Obtener id_usuario
            const { data: userData, error: userError } = await supabase
                .from('usuario')
                .select('id_usuario')
                .eq('auth_id', user.id)
                .single()

            if (userError) throw userError

            // Verificar si es el primer apunte
            const { count: apuntesCount } = await supabase
                .from('apunte')
                .select('id_apunte', { count: 'exact', head: true })
                .eq('id_usuario', userData.id_usuario)

            const esPrimerApunte = apuntesCount === 1

            // Calcular créditos
            const { data: calculados, error: calcError } = await this.calculateNoteCredits(numPaginas, materiaId)
            if (calcError) throw calcError

            // Otorgar créditos inmediatos
            const { error: creditError } = await this.addCredits(
                calculados.creditosInmediatos,
                'apunte_subido',
                apunteId
            )

            if (creditError) throw creditError

            // Si es el primer apunte, dar bono de 50 créditos
            let bonoPrimerApunte = 0
            if (esPrimerApunte) {
                // Verificar que no se haya dado antes
                const { data: bonoExistente } = await supabase
                    .from('bonos_otorgados')
                    .select('id_bono')
                    .eq('id_usuario', userData.id_usuario)
                    .eq('tipo_bono', 'primer_apunte')
                    .single()

                if (!bonoExistente) {
                    await this.addCredits(50, 'bono_primer_apunte', apunteId)
                    await supabase.from('bonos_otorgados').insert({
                        id_usuario: userData.id_usuario,
                        tipo_bono: 'primer_apunte',
                        cantidad_creditos: 50
                    })
                    bonoPrimerApunte = 50
                }
            }

            return {
                data: {
                    creditosOtorgados: calculados.creditosInmediatos,
                    bonoPrimerApunte,
                    creditosPendientes: calculados.creditosBonos,
                    multiplicador: calculados.multiplicador
                },
                error: null
            }
        } catch (error) {
            return { data: null, error }
        }
    },

    // Otorgar créditos por reseña
    async grantReviewCredits(ratingId) {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return { data: null, error: 'No hay usuario logueado' }

            // Obtener id_usuario
            const { data: userData, error: userError } = await supabase
                .from('usuario')
                .select('id_usuario')
                .eq('auth_id', user.id)
                .single()

            if (userError) throw userError

            // Verificar que la reseña no haya dado créditos antes
            const { data: rating, error: ratingError } = await supabase
                .from('rating')
                .select('creditos_otorgados')
                .eq('id', ratingId)
                .single()

            if (ratingError) throw ratingError

            if (rating.creditos_otorgados) {
                return { data: null, error: 'Esta reseña ya otorgó créditos' }
            }

            // Otorgar 10 créditos por reseña válida
            const { error: creditError } = await this.addCredits(10, 'resena_profesor', ratingId)
            if (creditError) throw creditError

            // Marcar que esta reseña ya dio créditos
            await supabase
                .from('rating')
                .update({ creditos_otorgados: true })
                .eq('id', ratingId)

            return { data: { creditosOtorgados: 10 }, error: null }
        } catch (error) {
            return { data: null, error }
        }
    },

    // Verificar y otorgar bonos por hitos
    async checkAndGrantMilestoneBonus() {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return { data: null, error: 'No hay usuario logueado' }

            // Obtener cantidad de apuntes subidos por el usuario
            const { data: userData, error: userError } = await supabase
                .from('usuario')
                .select('id_usuario')
                .eq('auth_id', user.id)
                .single()

            if (userError) throw userError

            const { count: apuntesCount } = await supabase
                .from('apunte')
                .select('id_apunte', { count: 'exact', head: true })
                .eq('id_usuario', userData.id_usuario)

            // Definir hitos y sus bonos
            const milestones = {
                10: 100,
                25: 250,
                50: 500,
                100: 1000,
                250: 2500,
                500: 5000,
                1000: 10000
            }

            // Verificar qué bonos ya fueron otorgados
            const { data: bonosOtorgados } = await supabase
                .from('bonos_otorgados')
                .select('tipo_bono')
                .eq('id_usuario', userData.id_usuario)
                .in('tipo_bono', Object.keys(milestones).map(m => `hito_${m}`))

            const bonosYaOtorgados = new Set(
                (bonosOtorgados || []).map(b => b.tipo_bono)
            )

            // Buscar hitos alcanzados que no se hayan otorgado
            const bonosNuevos = []
            for (const [hito, creditos] of Object.entries(milestones)) {
                const hitoNum = Number(hito)
                const tipoBono = `hito_${hito}`

                if (apuntesCount >= hitoNum && !bonosYaOtorgados.has(tipoBono)) {
                    // Otorgar este bono
                    await this.addCredits(creditos, 'bono_hito', null)
                    await supabase.from('bonos_otorgados').insert({
                        id_usuario: userData.id_usuario,
                        tipo_bono: tipoBono,
                        cantidad_creditos: creditos
                    })

                    bonosNuevos.push({ hito: hitoNum, creditos })
                    console.log(`🎁 Bono por hito alcanzado: ${hitoNum} apuntes = ${creditos} créditos`)
                }
            }

            // Encontrar próximo hito
            const nextMilestone = Object.keys(milestones)
                .map(Number)
                .find(m => m > apuntesCount)

            return {
                data: {
                    apuntesSubidos: apuntesCount,
                    bonosOtorgados: bonosNuevos,
                    proximoHito: nextMilestone,
                    bonoProximo: nextMilestone ? milestones[nextMilestone] : null
                },
                error: null
            }
        } catch (error) {
            return { data: null, error }
        }
    },

    // Obtener paquetes de créditos disponibles
    async getCreditPackages() {
        const { data, error } = await supabase
            .from('paquete_creditos')
            .select('*')
            .eq('activo', true)
            .order('cantidad_creditos', { ascending: true })

        return { data, error }
    },

    // Otorgar bono de bienvenida (llamar al registrar usuario)
    async grantWelcomeBonus(userId) {
        try {
            // Verificar que no se haya dado antes
            const { data: bonoExistente } = await supabase
                .from('bonos_otorgados')
                .select('id_bono')
                .eq('id_usuario', userId)
                .eq('tipo_bono', 'bienvenida')
                .single()

            if (bonoExistente) {
                return { data: null, error: 'Bono de bienvenida ya otorgado' }
            }

            // Otorgar 50 créditos
            const { data: userData } = await supabase
                .from('usuario')
                .select('auth_id')
                .eq('id_usuario', userId)
                .single()

            if (!userData) throw new Error('Usuario no encontrado')

            // Actualizar créditos directamente
            await supabase
                .from('usuario')
                .update({ creditos: 50 })
                .eq('id_usuario', userId)

            // Registrar en historial
            await supabase.from('historial_creditos').insert({
                id_usuario: userId,
                cantidad_creditos: 50,
                tipo_transaccion: 'bono_bienvenida',
                descripcion: 'Bono de bienvenida'
            })

            // Registrar en bonos otorgados
            await supabase.from('bonos_otorgados').insert({
                id_usuario: userId,
                tipo_bono: 'bienvenida',
                cantidad_creditos: 50
            })

            return { data: { creditosOtorgados: 50 }, error: null }
        } catch (error) {
            return { data: null, error }
        }
    },

    // Verificar y otorgar bonos por compras
    async checkAndGrantPurchaseBonus() {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return { data: null, error: 'No hay usuario logueado' }

            // Obtener id_usuario
            const { data: userData, error: userError } = await supabase
                .from('usuario')
                .select('id_usuario')
                .eq('auth_id', user.id)
                .single()

            if (userError) throw userError

            // Contar apuntes comprados por el usuario
            const { count: comprasCount } = await supabase
                .from('compra_apunte')
                .select('id', { count: 'exact', head: true })
                .eq('comprador_id', userData.id_usuario)

            // Definir hitos y sus bonos
            const purchaseMilestones = {
                10: 50,
                25: 100,
                50: 200,
                100: 350
            }

            // Verificar qué bonos ya fueron otorgados
            const { data: bonosOtorgados } = await supabase
                .from('bonos_otorgados')
                .select('tipo_bono')
                .eq('id_usuario', userData.id_usuario)
                .in('tipo_bono', Object.keys(purchaseMilestones).map(m => `compras_${m}`))

            const bonosYaOtorgados = new Set(
                (bonosOtorgados || []).map(b => b.tipo_bono)
            )

            // Buscar hitos alcanzados que no se hayan otorgado
            const bonosNuevos = []
            for (const [hito, creditos] of Object.entries(purchaseMilestones)) {
                const hitoNum = Number(hito)
                const tipoBono = `compras_${hito}`

                if (comprasCount >= hitoNum && !bonosYaOtorgados.has(tipoBono)) {
                    // Otorgar este bono
                    await this.addCredits(creditos, 'bono_compras', null)
                    await supabase.from('bonos_otorgados').insert({
                        id_usuario: userData.id_usuario,
                        tipo_bono: tipoBono,
                        cantidad_creditos: creditos
                    })

                    bonosNuevos.push({ hito: hitoNum, creditos })
                    console.log(`🛒 Bono por compras alcanzado: ${hitoNum} apuntes = ${creditos} créditos`)
                }
            }

            // Encontrar próximo hito
            const nextMilestone = Object.keys(purchaseMilestones)
                .map(Number)
                .find(m => m > comprasCount)

            return {
                data: {
                    apuntesComprados: comprasCount,
                    bonosOtorgados: bonosNuevos,
                    proximoHito: nextMilestone,
                    bonoProximo: nextMilestone ? purchaseMilestones[nextMilestone] : null
                },
                error: null
            }
        } catch (error) {
            return { data: null, error }
        }
    },

    // Verificar y otorgar bonos por likes en tus apuntes
    async checkAndGrantLikesBonus(apunteAutorId) {
        try {
            // Contar likes totales en todos los apuntes del usuario
            const { data: apuntesData, error: apuntesError } = await supabase
                .from('apunte')
                .select('id_apunte')
                .eq('id_usuario', apunteAutorId);

            if (apuntesError) throw apuntesError;

            const apunteIds = (apuntesData || []).map(a => a.id_apunte);
            if (apunteIds.length === 0) return { data: null, error: null };

            // Contar likes totales
            const { count: likesCount } = await supabase
                .from('likes')
                .select('*', { count: 'exact', head: true })
                .in('id_apunte', apunteIds)
                .eq('tipo', 'like');

            // Definir hitos y sus bonos (Opción 1: 50% del valor)
            const likesMilestones = {
                25: 12,
                50: 25,
                100: 50,
                250: 125,
                500: 250,
                1000: 500
            };

            // Verificar qué bonos ya fueron otorgados
            const { data: bonosOtorgados } = await supabase
                .from('bonos_otorgados')
                .select('tipo_bono')
                .eq('id_usuario', apunteAutorId)
                .in('tipo_bono', Object.keys(likesMilestones).map(m => `likes_${m}`));

            const bonosYaOtorgados = new Set(
                (bonosOtorgados || []).map(b => b.tipo_bono)
            );

            // Buscar hitos alcanzados que no se hayan otorgado
            const bonosNuevos = [];
            for (const [hito, creditos] of Object.entries(likesMilestones)) {
                const hitoNum = Number(hito);
                const tipoBono = `likes_${hito}`;

                if (likesCount >= hitoNum && !bonosYaOtorgados.has(tipoBono)) {
                    // Otorgar este bono
                    // Primero obtener el auth_id del autor para usar addCredits
                    const { data: autorData } = await supabase
                        .from('usuario')
                        .select('auth_id, creditos')
                        .eq('id_usuario', apunteAutorId)
                        .single();

                    if (autorData) {
                        // Actualizar créditos directamente
                        await supabase
                            .from('usuario')
                            .update({ creditos: autorData.creditos + creditos })
                            .eq('id_usuario', apunteAutorId);

                        // Registrar en historial
                        const historialData = {
                            id_usuario: apunteAutorId,
                            cantidad_creditos: creditos,
                            tipo_transaccion: 'bono_likes',
                            descripcion: `Bono por ${hitoNum} likes en tus apuntes`
                        };
                        await supabase.from('historial_creditos').insert(historialData);

                        // Registrar bono otorgado
                        await supabase.from('bonos_otorgados').insert({
                            id_usuario: apunteAutorId,
                            tipo_bono: tipoBono,
                            cantidad_creditos: creditos
                        });

                        bonosNuevos.push({ hito: hitoNum, creditos });
                        console.log(`❤️ Bono por likes alcanzado: ${hitoNum} likes = ${creditos} créditos`);
                    }
                }
            }

            return {
                data: {
                    likesTotales: likesCount || 0,
                    bonosOtorgados: bonosNuevos
                },
                error: null
            };
        } catch (error) {
            console.error('Error en checkAndGrantLikesBonus:', error);
            return { data: null, error };
        }
    },

    // Verificar y otorgar bonos por ventas (5% del total con tope de 200)
    async checkAndGrantSalesBonus(vendedorId) {
        try {
            // 1. Obtener todos los apuntes del vendedor
            const { data: apuntesData, error: apuntesError } = await supabase
                .from('apunte')
                .select('id_apunte, creditos')
                .eq('id_usuario', vendedorId);

            if (apuntesError) throw apuntesError;

            const apunteIds = (apuntesData || []).map(a => a.id_apunte);
            if (apunteIds.length === 0) return { data: null, error: null };

            // 2. Contar ventas totales de sus apuntes
            const { count: ventasCount } = await supabase
                .from('compra_apunte')
                .select('*', { count: 'exact', head: true })
                .in('apunte_id', apunteIds);

            // 3. Calcular total acumulado en ventas
            const { data: comprasData } = await supabase
                .from('compra_apunte')
                .select('apunte_id')
                .in('apunte_id', apunteIds);

            let totalAcumulado = 0;
            if (comprasData) {
                // Sumar el precio de cada apunte vendido
                for (const compra of comprasData) {
                    const apunte = apuntesData.find(a => a.id_apunte === compra.apunte_id);
                    if (apunte) {
                        totalAcumulado += apunte.creditos || 0;
                    }
                }
            }

            // 4. Definir hitos
            const salesMilestones = {
                10: true,
                25: true,
                50: true,
                100: true,
                250: true,
                500: true,
                1000: true
            };

            // 5. Verificar qué bonos ya fueron otorgados
            const { data: bonosOtorgados } = await supabase
                .from('bonos_otorgados')
                .select('tipo_bono')
                .eq('id_usuario', vendedorId)
                .in('tipo_bono', Object.keys(salesMilestones).map(m => `ventas_${m}`));

            const bonosYaOtorgados = new Set(
                (bonosOtorgados || []).map(b => b.tipo_bono)
            );

            // 6. Buscar hitos alcanzados que no se hayan otorgado
            const bonosNuevos = [];
            for (const hito of Object.keys(salesMilestones)) {
                const hitoNum = Number(hito);
                const tipoBono = `ventas_${hito}`;

                if (ventasCount >= hitoNum && !bonosYaOtorgados.has(tipoBono)) {
                    // Calcular 5% del total con tope de 200
                    let creditos = Math.floor(totalAcumulado * 0.05);
                    creditos = Math.min(creditos, 200); // Aplicar tope

                    if (creditos > 0) {
                        // Obtener datos del vendedor
                        const { data: vendedorData } = await supabase
                            .from('usuario')
                            .select('creditos')
                            .eq('id_usuario', vendedorId)
                            .single();

                        if (vendedorData) {
                            // Actualizar créditos
                            await supabase
                                .from('usuario')
                                .update({ creditos: vendedorData.creditos + creditos })
                                .eq('id_usuario', vendedorId);

                            // Registrar en historial
                            const historialData = {
                                id_usuario: vendedorId,
                                cantidad_creditos: creditos,
                                tipo_transaccion: 'bono_ventas',
                                descripcion: `Bono por ${hitoNum} ventas (5% de ${totalAcumulado})`
                            };
                            await supabase.from('historial_creditos').insert(historialData);

                            // Registrar bono otorgado
                            await supabase.from('bonos_otorgados').insert({
                                id_usuario: vendedorId,
                                tipo_bono: tipoBono,
                                cantidad_creditos: creditos
                            });

                            bonosNuevos.push({ hito: hitoNum, creditos });
                            console.log(`💰 Bono por ventas alcanzado: ${hitoNum} ventas = +${creditos} créditos (5% de ${totalAcumulado})`);
                        }
                    }
                }
            }

            return {
                data: {
                    ventasTotales: ventasCount || 0,
                    totalAcumulado,
                    bonosOtorgados: bonosNuevos
                },
                error: null
            };
        } catch (error) {
            console.error('Error en checkAndGrantSalesBonus:', error);
            return { data: null, error };
        }
    },

    // Obtener Top Mensual (actual o histórico)
    async getTopMensual(mes = null, año = null) {
        try {
            // Si no se especifica mes/año, usar el mes anterior
            if (!mes || !año) {
                const ahora = new Date();
                const mesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
                mes = mesAnterior.getMonth() + 1;
                año = mesAnterior.getFullYear();
            }

            const { data, error } = await supabase
                .from('top_mensual')
                .select(`
                    *,
                    apunte(id_apunte, titulo, thumbnail_path),
                    usuario(id_usuario, nombre, username, foto)
                `)
                .eq('mes', mes)
                .eq('año', año)
                .order('posicion', { ascending: true });

            return { data, error };
        } catch (error) {
            return { data: null, error };
        }
    },

    // Obtener todos los tops históricos
    async getTopHistorico() {
        try {
            const { data, error } = await supabase
                .from('top_mensual')
                .select('mes, año')
                .order('año', { ascending: false })
                .order('mes', { ascending: false });

            // Obtener lista única de mes/año
            const mesesUnicos = [];
            const seen = new Set();

            for (const item of data || []) {
                const key = `${item.año}-${item.mes}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    mesesUnicos.push({ mes: item.mes, año: item.año });
                }
            }

            return { data: mesesUnicos, error };
        } catch (error) {
            return { data: null, error };
        }
    }
}