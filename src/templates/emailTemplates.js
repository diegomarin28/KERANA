/**
 * Templates de emails para el sistema de mentorías de Kerana
 * Todos usan inline CSS para máxima compatibilidad
 */

const baseStyles = `
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
`;

const containerStyles = `
    max-width: 600px;
    margin: 0 auto;
    background: #ffffff;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
`;

const headerStyles = `
    background: linear-gradient(135deg, #13346b 0%, #2563eb 60%, #0ea5a3 100%);
    padding: 32px 24px;
    text-align: center;
`;

const contentStyles = `
    padding: 32px 24px;
    background: #ffffff;
`;

const footerStyles = `
    padding: 24px;
    background: #f8fafc;
    text-align: center;
    border-top: 2px solid #e2e8f0;
`;

const buttonStyles = `
    display: inline-block;
    padding: 12px 24px;
    background: #0d9488;
    color: #ffffff;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
    font-size: 14px;
    margin: 16px 0;
`;

/**
 * =========================================
 * EMAILS DE CONFIRMACIÓN INSTANTÁNEA
 * =========================================
 */

/**
 * VIRTUAL - Email de confirmación para el MENTOR
 */
export function emailConfirmacionMentorVirtual({
                                                   mentorNombre,
                                                   alumnoNombre,
                                                   alumnoEmail,
                                                   materiaNombre,
                                                   fecha,
                                                   hora,
                                                   duracion,
                                                   cantidadAlumnos,
                                                   emailsParticipantes,
                                                   descripcion
                                               }) {
    const emailsHTML = emailsParticipantes && emailsParticipantes.length > 0
        ? `
            <div style="margin: 20px 0; padding: 16px; background: #f0f9ff; border-left: 4px solid #0284c7; border-radius: 8px;">
                <p style="margin: 0 0 12px 0; font-weight: 600; color: #0c4a6e;">
                    📧 Emails de participantes:
                </p>
                ${emailsParticipantes.map((email, idx) => `
                    <div style="margin: 8px 0; padding: 8px 12px; background: #e0f2fe; border-radius: 6px; font-size: 13px; color: #0c4a6e;">
                        ${idx + 1}. ${email}
                    </div>
                `).join('')}
            </div>
        `
        : '';

    const descripcionHTML = descripcion
        ? `
            <div style="margin: 20px 0; padding: 16px; background: #f0fdf4; border-left: 4px solid #0d9488; border-radius: 8px;">
                <p style="margin: 0 0 8px 0; font-weight: 600; color: #065f46;">
                    💬 Descripción de la sesión:
                </p>
                <p style="margin: 0; color: #065f46; font-style: italic;">
                    "${descripcion}"
                </p>
            </div>
        `
        : '';

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Nueva Mentoría Virtual</title>
        </head>
        <body style="${baseStyles} margin: 0; padding: 20px; background: #f8fafc;">
            <div style="${containerStyles}">
                <div style="${headerStyles}">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Kerana</h1>
                    <p style="margin: 8px 0 0 0; color: #e0f2fe; font-size: 16px;">Nueva mentoría virtual confirmada</p>
                </div>

                <div style="${contentStyles}">
                    <h2 style="margin: 0 0 24px 0; color: #0f172a; font-size: 24px; font-weight: 700;">
                        ✅ Mentoría virtual confirmada
                    </h2>

                    <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                        Hola <strong>${mentorNombre}</strong>,
                    </p>

                    <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                        Un alumno acaba de agendar una mentoría virtual contigo. Aquí están los detalles:
                    </p>

                    <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 24px 0;">
                        <div style="margin-bottom: 16px;">
                            <p style="margin: 0 0 4px 0; color: #64748b; font-size: 13px;">👤 Alumno</p>
                            <p style="margin: 0; color: #0f172a; font-weight: 600; font-size: 16px;">${alumnoNombre}</p>
                        </div>

                        <div style="margin-bottom: 16px;">
                            <p style="margin: 0 0 4px 0; color: #64748b; font-size: 13px;">📧 Email del alumno</p>
                            <p style="margin: 0; color: #0f172a; font-weight: 600; font-size: 16px;">${alumnoEmail}</p>
                        </div>

                        <div style="margin-bottom: 16px;">
                            <p style="margin: 0 0 4px 0; color: #64748b; font-size: 13px;">📚 Materia</p>
                            <p style="margin: 0; color: #0f172a; font-weight: 600; font-size: 16px;">${materiaNombre}</p>
                        </div>

                        <div style="margin-bottom: 16px;">
                            <p style="margin: 0 0 4px 0; color: #64748b; font-size: 13px;">📅 Fecha y hora</p>
                            <p style="margin: 0; color: #0f172a; font-weight: 600; font-size: 16px;">${fecha} a las ${hora}</p>
                            <p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px;">Duración: ${duracion} minutos</p>
                        </div>

                        <div style="margin-bottom: 16px;">
                            <p style="margin: 0 0 4px 0; color: #64748b; font-size: 13px;">👥 Participantes</p>
                            <p style="margin: 0; color: #0f172a; font-weight: 600; font-size: 16px;">
                                ${cantidadAlumnos} ${cantidadAlumnos === 1 ? 'persona' : 'personas'}
                            </p>
                        </div>

                        <div>
                            <p style="margin: 0 0 4px 0; color: #64748b; font-size: 13px;">💻 Modalidad</p>
                            <p style="margin: 0; color: #0f172a; font-weight: 600; font-size: 16px;">Virtual (Teams)</p>
                        </div>
                    </div>

                    ${emailsHTML}
                    ${descripcionHTML}

                    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 24px 0;">
                        <h3 style="margin: 0 0 12px 0; color: #92400e; font-size: 18px; font-weight: 700;">
                            ⚠️ Acción requerida
                        </h3>
                        <p style="margin: 0 0 16px 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                            Por favor, <strong>crea una reunión de Teams</strong> y agendala con el alumno usando su email.
                        </p>
                        <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                            El alumno recibirá la invitación automáticamente por email desde Teams.
                        </p>
                    </div>

                    <div style="text-align: center; margin: 32px 0;">
                        <a href="https://youtube.com/tutorial-teams" style="${buttonStyles}">
                            📺 Ver tutorial: Cómo crear reunión en Teams
                        </a>
                    </div>

                    <p style="margin: 24px 0 0 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                        Si tenés algún problema, contactanos a través de la plataforma.
                    </p>
                </div>

                <div style="${footerStyles}">
                    <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px;">© 2025 Kerana - Plataforma de Mentorías</p>
                    <p style="margin: 0; color: #94a3b8; font-size: 12px;">Montevideo, Uruguay</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

/**
 * VIRTUAL - Email de confirmación para el ALUMNO
 */
export function emailConfirmacionAlumnoVirtual({
                                                   alumnoNombre,
                                                   mentorNombre,
                                                   materiaNombre,
                                                   fecha,
                                                   hora,
                                                   duracion
                                               }) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Mentoría Virtual Confirmada</title>
        </head>
        <body style="${baseStyles} margin: 0; padding: 20px; background: #f8fafc;">
            <div style="${containerStyles}">
                <div style="${headerStyles}">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Kerana</h1>
                    <p style="margin: 8px 0 0 0; color: #e0f2fe; font-size: 16px;">Mentoría virtual confirmada</p>
                </div>

                <div style="${contentStyles}">
                    <h2 style="margin: 0 0 24px 0; color: #0f172a; font-size: 24px; font-weight: 700;">
                        ✅ Sesión virtual confirmada
                    </h2>

                    <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                        Hola <strong>${alumnoNombre}</strong>,
                    </p>

                    <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                        Tu mentoría virtual ha sido confirmada exitosamente. Aquí están los detalles:
                    </p>

                    <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 24px 0;">
                        <div style="margin-bottom: 16px;">
                            <p style="margin: 0 0 4px 0; color: #64748b; font-size: 13px;">👨‍🏫 Mentor</p>
                            <p style="margin: 0; color: #0f172a; font-weight: 600; font-size: 16px;">${mentorNombre}</p>
                        </div>

                        <div style="margin-bottom: 16px;">
                            <p style="margin: 0 0 4px 0; color: #64748b; font-size: 13px;">📚 Materia</p>
                            <p style="margin: 0; color: #0f172a; font-weight: 600; font-size: 16px;">${materiaNombre}</p>
                        </div>

                        <div style="margin-bottom: 16px;">
                            <p style="margin: 0 0 4px 0; color: #64748b; font-size: 13px;">📅 Fecha y hora</p>
                            <p style="margin: 0; color: #0f172a; font-weight: 600; font-size: 16px;">${fecha} a las ${hora}</p>
                            <p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px;">Duración: ${duracion} minutos</p>
                        </div>

                        <div>
                            <p style="margin: 0 0 4px 0; color: #64748b; font-size: 13px;">💻 Modalidad</p>
                            <p style="margin: 0; color: #0f172a; font-weight: 600; font-size: 16px;">Virtual (Teams)</p>
                        </div>
                    </div>

                    <div style="background: #eff6ff; border-left: 4px solid #2563eb; border-radius: 8px; padding: 20px; margin: 24px 0;">
                        <h3 style="margin: 0 0 12px 0; color: #1e40af; font-size: 16px; font-weight: 700;">
                            📧 Próximos pasos
                        </h3>
                        <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
                            En las próximas horas <strong>recibirás un email desde Microsoft Teams</strong> con la invitación a la reunión virtual.
                        </p>
                        <p style="margin: 12px 0 0 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
                            <strong>Revisá tu correo institucional</strong> (@correo.um.edu.uy)
                        </p>
                    </div>

                    <div style="text-align: center; margin: 32px 0;">
                        <a href="https://kerana.com/upcoming-mentorships" style="${buttonStyles}">
                            Ver mis mentorías
                        </a>
                    </div>

                    <p style="margin: 24px 0 0 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                        Si tenés alguna duda, no dudes en contactarnos.
                    </p>
                </div>

                <div style="${footerStyles}">
                    <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px;">© 2025 Kerana - Plataforma de Mentorías</p>
                    <p style="margin: 0; color: #94a3b8; font-size: 12px;">Montevideo, Uruguay</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

/**
 * PRESENCIAL - Email de confirmación para el MENTOR
 */
export function emailConfirmacionMentorPresencial({
                                                      mentorNombre,
                                                      alumnoNombre,
                                                      alumnoEmail,
                                                      materiaNombre,
                                                      fecha,
                                                      hora,
                                                      duracion,
                                                      cantidadAlumnos,
                                                      emailsParticipantes,
                                                      descripcion
                                                  }) {
    const emailsHTML = emailsParticipantes && emailsParticipantes.length > 0
        ? `
            <div style="margin: 20px 0; padding: 16px; background: #f0f9ff; border-left: 4px solid #0284c7; border-radius: 8px;">
                <p style="margin: 0 0 12px 0; font-weight: 600; color: #0c4a6e;">
                    📧 Emails de participantes:
                </p>
                ${emailsParticipantes.map((email, idx) => `
                    <div style="margin: 8px 0; padding: 8px 12px; background: #e0f2fe; border-radius: 6px; font-size: 13px; color: #0c4a6e;">
                        ${idx + 1}. ${email}
                    </div>
                `).join('')}
            </div>
        `
        : '';

    const descripcionHTML = descripcion
        ? `
            <div style="margin: 20px 0; padding: 16px; background: #f0fdf4; border-left: 4px solid #0d9488; border-radius: 8px;">
                <p style="margin: 0 0 8px 0; font-weight: 600; color: #065f46;">
                    💬 Descripción de la sesión:
                </p>
                <p style="margin: 0; color: #065f46; font-style: italic;">
                    "${descripcion}"
                </p>
            </div>
        `
        : '';

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Nueva Mentoría Presencial</title>
        </head>
        <body style="${baseStyles} margin: 0; padding: 20px; background: #f8fafc;">
            <div style="${containerStyles}">
                <div style="${headerStyles}">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Kerana</h1>
                    <p style="margin: 8px 0 0 0; color: #e0f2fe; font-size: 16px;">Nueva mentoría presencial confirmada</p>
                </div>

                <div style="${contentStyles}">
                    <h2 style="margin: 0 0 24px 0; color: #0f172a; font-size: 24px; font-weight: 700;">
                        ✅ Mentoría presencial confirmada
                    </h2>

                    <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                        Hola <strong>${mentorNombre}</strong>,
                    </p>

                    <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                        Un alumno acaba de agendar una mentoría presencial contigo. Aquí están los detalles:
                    </p>

                    <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 24px 0;">
                        <div style="margin-bottom: 16px;">
                            <p style="margin: 0 0 4px 0; color: #64748b; font-size: 13px;">👤 Alumno</p>
                            <p style="margin: 0; color: #0f172a; font-weight: 600; font-size: 16px;">${alumnoNombre}</p>
                        </div>

                        <div style="margin-bottom: 16px;">
                            <p style="margin: 0 0 4px 0; color: #64748b; font-size: 13px;">📧 Email del alumno</p>
                            <p style="margin: 0; color: #0f172a; font-weight: 600; font-size: 16px;">${alumnoEmail}</p>
                        </div>

                        <div style="margin-bottom: 16px;">
                            <p style="margin: 0 0 4px 0; color: #64748b; font-size: 13px;">📚 Materia</p>
                            <p style="margin: 0; color: #0f172a; font-weight: 600; font-size: 16px;">${materiaNombre}</p>
                        </div>

                        <div style="margin-bottom: 16px;">
                            <p style="margin: 0 0 4px 0; color: #64748b; font-size: 13px;">📅 Fecha y hora</p>
                            <p style="margin: 0; color: #0f172a; font-weight: 600; font-size: 16px;">${fecha} a las ${hora}</p>
                            <p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px;">Duración: ${duracion} minutos</p>
                        </div>

                        <div style="margin-bottom: 16px;">
                            <p style="margin: 0 0 4px 0; color: #64748b; font-size: 13px;">👥 Participantes</p>
                            <p style="margin: 0; color: #0f172a; font-weight: 600; font-size: 16px;">
                                ${cantidadAlumnos} ${cantidadAlumnos === 1 ? 'persona' : 'personas'}
                            </p>
                        </div>

                        <div>
                            <p style="margin: 0 0 4px 0; color: #64748b; font-size: 13px;">📍 Modalidad</p>
                            <p style="margin: 0; color: #0f172a; font-weight: 600; font-size: 16px;">Presencial</p>
                        </div>
                    </div>

                    ${emailsHTML}
                    ${descripcionHTML}

                    <div style="background: #f0fdf4; border-left: 4px solid #10b981; border-radius: 8px; padding: 20px; margin: 24px 0;">
                        <h3 style="margin: 0 0 12px 0; color: #065f46; font-size: 18px; font-weight: 700;">
                            📍 Recordatorios programados
                        </h3>
                        <p style="margin: 0; color: #065f46; font-size: 14px; line-height: 1.6;">
                            Recibirás un recordatorio <strong>24 horas antes</strong> de la sesión para que te prepares.
                        </p>
                    </div>

                    <p style="margin: 24px 0 0 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                        Si tenés algún problema, contactanos a través de la plataforma.
                    </p>
                </div>

                <div style="${footerStyles}">
                    <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px;">© 2025 Kerana - Plataforma de Mentorías</p>
                    <p style="margin: 0; color: #94a3b8; font-size: 12px;">Montevideo, Uruguay</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

/**
 * PRESENCIAL - Email de confirmación para el ALUMNO
 */
export function emailConfirmacionAlumnoPresencial({
                                                      alumnoNombre,
                                                      mentorNombre,
                                                      materiaNombre,
                                                      fecha,
                                                      hora,
                                                      duracion
                                                  }) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Mentoría Presencial Confirmada</title>
        </head>
        <body style="${baseStyles} margin: 0; padding: 20px; background: #f8fafc;">
            <div style="${containerStyles}">
                <div style="${headerStyles}">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Kerana</h1>
                    <p style="margin: 8px 0 0 0; color: #e0f2fe; font-size: 16px;">Mentoría presencial confirmada</p>
                </div>

                <div style="${contentStyles}">
                    <h2 style="margin: 0 0 24px 0; color: #0f172a; font-size: 24px; font-weight: 700;">
                        ✅ Sesión presencial confirmada
                    </h2>

                    <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                        Hola <strong>${alumnoNombre}</strong>,
                    </p>

                    <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                        Tu mentoría presencial ha sido confirmada exitosamente. Aquí están los detalles:
                    </p>

                    <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 24px 0;">
                        <div style="margin-bottom: 16px;">
                            <p style="margin: 0 0 4px 0; color: #64748b; font-size: 13px;">👨‍🏫 Mentor</p>
                            <p style="margin: 0; color: #0f172a; font-weight: 600; font-size: 16px;">${mentorNombre}</p>
                        </div>

                        <div style="margin-bottom: 16px;">
                            <p style="margin: 0 0 4px 0; color: #64748b; font-size: 13px;">📚 Materia</p>
                            <p style="margin: 0; color: #0f172a; font-weight: 600; font-size: 16px;">${materiaNombre}</p>
                        </div>

                        <div style="margin-bottom: 16px;">
                            <p style="margin: 0 0 4px 0; color: #64748b; font-size: 13px;">📅 Fecha y hora</p>
                            <p style="margin: 0; color: #0f172a; font-weight: 600; font-size: 16px;">${fecha} a las ${hora}</p>
                            <p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px;">Duración: ${duracion} minutos</p>
                        </div>

                        <div>
                            <p style="margin: 0 0 4px 0; color: #64748b; font-size: 13px;">📍 Modalidad</p>
                            <p style="margin: 0; color: #0f172a; font-weight: 600; font-size: 16px;">Presencial</p>
                        </div>
                    </div>

                    <div style="background: #f0fdf4; border-left: 4px solid #10b981; border-radius: 8px; padding: 20px; margin: 24px 0;">
                        <h3 style="margin: 0 0 12px 0; color: #065f46; font-size: 16px; font-weight: 700;">
                            📍 Ubicación
                        </h3>
                        <p style="margin: 0; color: #065f46; font-size: 14px; line-height: 1.6;">
                            La mentoría será presencial. El mentor te contactará para coordinar los detalles del lugar.
                        </p>
                    </div>

                    <div style="background: #eff6ff; border-left: 4px solid #2563eb; border-radius: 8px; padding: 20px; margin: 24px 0;">
                        <h3 style="margin: 0 0 12px 0; color: #1e40af; font-size: 16px; font-weight: 700;">
                            🔔 Recordatorios
                        </h3>
                        <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
                            Recibirás un recordatorio <strong>1 hora antes</strong> de la sesión con todos los detalles.
                        </p>
                    </div>

                    <div style="text-align: center; margin: 32px 0;">
                        <a href="https://kerana.com/upcoming-mentorships" style="${buttonStyles}">
                            Ver mis mentorías
                        </a>
                    </div>

                    <p style="margin: 24px 0 0 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                        Si tenés alguna duda, no dudes en contactarnos.
                    </p>
                </div>

                <div style="${footerStyles}">
                    <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px;">© 2025 Kerana - Plataforma de Mentorías</p>
                    <p style="margin: 0; color: #94a3b8; font-size: 12px;">Montevideo, Uruguay</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

/**
 * =========================================
 * EMAILS DE RECORDATORIO (SOLO PRESENCIAL)
 * =========================================
 */

/**
 * Email recordatorio 24h antes para el MENTOR (PRESENCIAL)
 */
export function emailRecordatorio24hMentor({
                                               mentorNombre,
                                               alumnoNombre,
                                               alumnoEmail,
                                               materiaNombre,
                                               fecha,
                                               hora
                                           }) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Recordatorio: Mentoría Mañana</title>
        </head>
        <body style="${baseStyles} margin: 0; padding: 20px; background: #f8fafc;">
            <div style="${containerStyles}">
                <div style="${headerStyles}">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Kerana</h1>
                    <p style="margin: 8px 0 0 0; color: #e0f2fe; font-size: 16px;">Recordatorio de mentoría</p>
                </div>

                <div style="${contentStyles}">
                    <h2 style="margin: 0 0 24px 0; color: #0f172a; font-size: 24px; font-weight: 700;">
                        🔔 Faltan 24 horas para tu mentoría
                    </h2>

                    <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                        Hola <strong>${mentorNombre}</strong>,
                    </p>

                    <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                        Te recordamos que mañana tenés una mentoría presencial programada:
                    </p>

                    <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 24px 0;">
                        <p style="margin: 0 0 12px 0; color: #64748b; font-size: 13px;">
                            👤 Alumno: <strong style="color: #0f172a;">${alumnoNombre}</strong>
                        </p>
                        <p style="margin: 0 0 12px 0; color: #64748b; font-size: 13px;">
                            📧 Email: <strong style="color: #0f172a;">${alumnoEmail}</strong>
                        </p>
                        <p style="margin: 0 0 12px 0; color: #64748b; font-size: 13px;">
                            📚 Materia: <strong style="color: #0f172a;">${materiaNombre}</strong>
                        </p>
                        <p style="margin: 0; color: #64748b; font-size: 13px;">
                            📅 Hora: <strong style="color: #0f172a;">${fecha} a las ${hora}</strong>
                        </p>
                    </div>

                    <div style="background: #f0fdf4; border-left: 4px solid #10b981; border-radius: 8px; padding: 20px; margin: 24px 0;">
                        <h3 style="margin: 0 0 12px 0; color: #065f46; font-size: 16px; font-weight: 700;">
                            ✅ Prepárate para la sesión
                        </h3>
                        <p style="margin: 0; color: #065f46; font-size: 14px; line-height: 1.6;">
                            Asegurate de tener todo el material preparado y coordina con el alumno el punto de encuentro.
                        </p>
                    </div>
                </div>

                <div style="${footerStyles}">
                    <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px;">© 2025 Kerana - Plataforma de Mentorías</p>
                    <p style="margin: 0; color: #94a3b8; font-size: 12px;">Montevideo, Uruguay</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

/**
 * Email recordatorio 1h antes para el ALUMNO (PRESENCIAL)
 */
export function emailRecordatorio1hAlumno({
                                              alumnoNombre,
                                              mentorNombre,
                                              materiaNombre,
                                              fecha,
                                              hora
                                          }) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>¡Tu clase comienza en 1 hora!</title>
        </head>
        <body style="${baseStyles} margin: 0; padding: 20px; background: #f8fafc;">
            <div style="${containerStyles}">
                <div style="${headerStyles}">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Kerana</h1>
                    <p style="margin: 8px 0 0 0; color: #e0f2fe; font-size: 16px;">Tu clase comienza pronto</p>
                </div>

                <div style="${contentStyles}">
                    <h2 style="margin: 0 0 24px 0; color: #0f172a; font-size: 24px; font-weight: 700;">
                        🔔 ¡Tu clase comienza en 1 hora!
                    </h2>

                    <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                        Hola <strong>${alumnoNombre}</strong>,
                    </p>

                    <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                        Te recordamos que tu mentoría presencial comienza hoy a las <strong>${hora}</strong>:
                    </p>

                    <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 24px 0;">
                        <p style="margin: 0 0 12px 0; color: #64748b; font-size: 13px;">
                            👨‍🏫 Mentor: <strong style="color: #0f172a;">${mentorNombre}</strong>
                        </p>
                        <p style="margin: 0 0 12px 0; color: #64748b; font-size: 13px;">
                            📚 Materia: <strong style="color: #0f172a;">${materiaNombre}</strong>
                        </p>
                        <p style="margin: 0; color: #64748b; font-size: 13px;">
                            📅 Hora: <strong style="color: #0f172a;">${hora}</strong>
                        </p>
                    </div>

                    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 24px 0;">
                        <h3 style="margin: 0 0 12px 0; color: #92400e; font-size: 16px; font-weight: 700;">
                            ⚠️ No olvides
                        </h3>
                        <ul style="margin: 0; padding-left: 20px; color: #92400e; font-size: 14px; line-height: 1.8;">
                            <li>Llevar todo el material necesario</li>
                            <li>Llegar puntual al punto de encuentro</li>
                            <li>Tener a mano el email del mentor por si surge algún imprevisto</li>
                        </ul>
                    </div>
                </div>

                <div style="${footerStyles}">
                    <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px;">© 2025 Kerana - Plataforma de Mentorías</p>
                    <p style="margin: 0; color: #94a3b8; font-size: 12px;">Montevideo, Uruguay</p>
                </div>
            </div>
        </body>
        </html>
    `;
}