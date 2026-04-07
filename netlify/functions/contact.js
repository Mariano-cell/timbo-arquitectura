/**
 * Netlify Serverless Function — Formulario de contacto Timbó
 *
 * Recibe POST con { name, email, subject, message }.
 * Envía un email usando Netlify Email Integration o un servicio externo.
 *
 * Para una implementación básica sin dependencias externas,
 * esta función valida los datos y los loguea.
 * Podés conectarla a SendGrid, Resend, Mailgun, etc.
 *
 * Variables de entorno necesarias (configurar en Netlify Dashboard):
 *   CONTACT_TO_EMAIL   — email destino (ej: estudio@timboarquitectura.com)
 */

exports.handler = async (event) => {
  // Solo aceptar POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método no permitido' }),
    };
  }

  // Parsear body
  let data;
  try {
    data = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'JSON inválido' }),
    };
  }

  const { name, email, subject, message } = data;

  // Validación básica
  if (!name || !email || !message) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Faltan campos obligatorios: nombre, email, mensaje.' }),
    };
  }

  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'El email no tiene un formato válido.' }),
    };
  }

  // ------------------------------------------------------------------
  // INTEGRACIÓN CON SERVICIO DE EMAIL
  // ------------------------------------------------------------------
  // Descomentá y configurá uno de estos proveedores:
  //
  // --- OPCIÓN A: Resend (recomendado, plan gratis disponible) ---
  // npm install resend  →  luego en Netlify env: RESEND_API_KEY
  //
  // const { Resend } = require('resend');
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({
  //   from: 'Timbó Web <noreply@timboarquitectura.com>',
  //   to: [process.env.CONTACT_TO_EMAIL],
  //   subject: subject || `Consulta de ${name}`,
  //   text: `Nombre: ${name}\nEmail: ${email}\n\n${message}`,
  // });
  //
  // --- OPCIÓN B: SendGrid ---
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // await sgMail.send({ ... });
  // ------------------------------------------------------------------

  // Por ahora, log del mensaje (visible en Netlify Functions log)
  console.log('📬 Nuevo mensaje de contacto:', {
    name,
    email,
    subject: subject || '(sin asunto)',
    message,
    timestamp: new Date().toISOString(),
  });

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true, message: 'Mensaje recibido correctamente.' }),
  };
};
