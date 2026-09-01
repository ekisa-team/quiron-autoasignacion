import { env } from "$env/dynamic/private";
import mssql from "mssql";
import nodemailer from "nodemailer";
import { getTenantDb } from "./db";

interface EmailParams {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  display: string;
  enableSsl: boolean;
}

async function getEmailConfig(clientId: number): Promise<EmailParams | null> {
  try {
    const pool = await getTenantDb(clientId);
    const request = pool.request();
    request.input("clientId", mssql.Int, clientId);

    const result = await request.query<{
      EmailServidorSmtp?: string;
      EmailPuertoSmtp?: number;
      EmailUsuarioSmtp?: string;
      EmailPasswordSmtp?: string;
      EmailHabilitarSsl?: boolean;
      EmailNombreRemitente?: string;
    }>(`
			SELECT TOP 1 
				EmailServidorSmtp,
				EmailPuertoSmtp,
				EmailUsuarioSmtp,
				EmailPasswordSmtp,
				EmailHabilitarSsl,
				EmailNombreRemitente
			FROM dbo.ParametrosEnvio 
			WHERE IdCliente = @clientId
		`);

    const row = result.recordset[0];

    if (!row || !row.EmailUsuarioSmtp || !row.EmailPasswordSmtp) {
      return null;
    }

    return {
      host: row.EmailServidorSmtp || "smtp.gmail.com",
      port: row.EmailPuertoSmtp || 587,
      user: row.EmailUsuarioSmtp,
      pass: row.EmailPasswordSmtp,
      from: row.EmailUsuarioSmtp,
      display: row.EmailNombreRemitente || "Quirón Instituciones",
      enableSsl: row.EmailHabilitarSsl ?? true,
    };
  } catch (error) {
    return null;
  }
}

export async function sendEmail(
  clientId: number,
  to: string,
  subject: string,
  htmlBody: string,
): Promise<boolean> {
  try {
    if (!to || !to.trim()) return false;

    const cfg = await getEmailConfig(clientId);
    if (!cfg) return false;

    const transporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.port === 465,
      auth: {
        user: cfg.user,
        pass: cfg.pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    await transporter.sendMail({
      from: `"${cfg.display}" <${cfg.from}>`,
      to,
      subject,
      html: htmlBody,
    });

    return true;
  } catch (error) {
    return false;
  }
}

export async function sendRegistrationVerificationEmail(
  clientId: number,
  email: string,
  fullName: string,
  identification: string,
  token: string,
): Promise<boolean> {
  const baseUrl = env.PUBLIC_BASE_URL || "http://localhost:5173";
  const link = `${baseUrl}/verify-email?t=${token}&c=${clientId}&p=${identification}`;

  const body = `
	<!DOCTYPE html>
	<html lang="es">
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>Verificación de Cuenta</title>
		<style>
			body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
			.wrapper { width: 100%; table-layout: fixed; background-color: #f1f5f9; padding: 40px 0; }
			.container { max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
			.header { background: linear-gradient(135deg, #0e7490 0%, #0891b2 100%); padding: 32px 24px; text-align: center; }
			.header h1 { margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
			.content { padding: 36px 32px; color: #334155; line-height: 1.6; }
			.content h2 { margin-top: 0; color: #0f172a; font-size: 18px; font-weight: 600; }
			.content p { font-size: 14px; margin: 16px 0; }
			.btn-wrapper { text-align: center; margin: 32px 0; }
			.btn { display: inline-block; background-color: #0891b2; color: #ffffff !important; text-decoration: none; padding: 13px 32px; border-radius: 6px; font-size: 14px; font-weight: 600; letter-spacing: 0.2px; }
			.divider { height: 1px; background-color: #f1f5f9; margin: 32px 0 20px 0; }
			.footer { padding: 0 32px 32px 32px; text-align: center; color: #94a3b8; font-size: 12px; }
			.footer p { margin: 4px 0; }
		</style>
	</head>
	<body>
		<div class="wrapper">
			<div class="container">
				<div class="header">
					<h1>Quirón Autoasignación</h1>
				</div>
				<div class="content">
					<h2>¡Bienvenido, ${fullName}!</h2>
					<p>Has registrado exitosamente tu cuenta en nuestra plataforma de autoasignación de citas médicas. Para activar tu acceso y garantizar la seguridad de tus datos, por favor confirma tu correo electrónico.</p>
					<div class="btn-wrapper">
						<a href="${link}" class="btn" target="_blank">Verificar mi cuenta</a>
					</div>
					<p style="font-size: 12px; color: #64748b;">Si no puedes hacer clic en el botón, copia y pega el siguiente enlace en tu navegador:</p>
					<p style="font-size: 11px; word-break: break-all; color: #0891b2;">${link}</p>
					<div class="divider"></div>
					<p style="font-size: 12px; color: #64748b; margin-bottom: 0;">Si tú no solicitaste este registro, puedes ignorar este mensaje.</p>
				</div>
				<div class="footer">
					<p>&copy; ${new Date().getFullYear()} Quirón Instituciones. Todos los derechos reservados.</p>
					<p>Este es un correo automático, por favor no respondas a este mensaje.</p>
				</div>
			</div>
		</div>
	</body>
	</html>
	`;

  return sendEmail(clientId, email, "Verificación de registro - Quirón", body);
}

export async function sendPasswordResetEmail(
  clientId: number,
  email: string,
  identification: string,
  token: string,
): Promise<boolean> {
  const baseUrl = env.PUBLIC_BASE_URL || "http://localhost:5173";
  const link = `${baseUrl}/reset-password?t=${token}&c=${clientId}&i=${identification}`;

  const body = `
	<!DOCTYPE html>
	<html lang="es">
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>Restablecer Contraseña</title>
		<style>
			body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
			.wrapper { width: 100%; table-layout: fixed; background-color: #f1f5f9; padding: 40px 0; }
			.container { max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
			.header { background: linear-gradient(135deg, #0e7490 0%, #0891b2 100%); padding: 32px 24px; text-align: center; }
			.header h1 { margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
			.content { padding: 36px 32px; color: #334155; line-height: 1.6; }
			.content h2 { margin-top: 0; color: #0f172a; font-size: 18px; font-weight: 600; }
			.content p { font-size: 14px; margin: 16px 0; }
			.alert-box { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 20px 0; border-radius: 0 4px 4px 0; }
			.alert-box p { margin: 0; font-size: 12px; color: #92400e; }
			.btn-wrapper { text-align: center; margin: 32px 0; }
			.btn { display: inline-block; background-color: #0891b2; color: #ffffff !important; text-decoration: none; padding: 13px 32px; border-radius: 6px; font-size: 14px; font-weight: 600; letter-spacing: 0.2px; }
			.divider { height: 1px; background-color: #f1f5f9; margin: 32px 0 20px 0; }
			.footer { padding: 0 32px 32px 32px; text-align: center; color: #94a3b8; font-size: 12px; }
			.footer p { margin: 4px 0; }
		</style>
	</head>
	<body>
		<div class="wrapper">
			<div class="container">
				<div class="header">
					<h1>Quirón Autoasignación</h1>
				</div>
				<div class="content">
					<h2>Solicitud de restablecimiento de contraseña</h2>
					<p>Hemos recibido una solicitud para restablecer la contraseña asociada al documento de identidad <strong>${identification}</strong>.</p>
					<div class="alert-box">
						<p>Este enlace de seguridad vencerá en <strong>1 hora</strong> por motivos de protección.</p>
					</div>
					<div class="btn-wrapper">
						<a href="${link}" class="btn" target="_blank">Restablecer mi contraseña</a>
					</div>
					<p style="font-size: 12px; color: #64748b;">Si no puedes hacer clic en el botón, copia y pega el siguiente enlace en tu navegador:</p>
					<p style="font-size: 11px; word-break: break-all; color: #0891b2;">${link}</p>
					<div class="divider"></div>
					<p style="font-size: 12px; color: #64748b; margin-bottom: 0;">Si tú no solicitaste este cambio, puedes ignorar este mensaje con total tranquilidad.</p>
				</div>
				<div class="footer">
					<p>&copy; ${new Date().getFullYear()} Quirón Instituciones. Todos los derechos reservados.</p>
					<p>Este es un correo automático, por favor no respondas a este mensaje.</p>
				</div>
			</div>
		</div>
	</body>
	</html>
	`;

  return sendEmail(clientId, email, "Restablecer contraseña - Quirón", body);
}

export async function sendPasswordChangeNotification(
  clientId: number,
  email: string,
): Promise<boolean> {
  const body = `
	<!DOCTYPE html>
	<html lang="es">
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>Cambio de Contraseña</title>
		<style>
			body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
			.wrapper { width: 100%; table-layout: fixed; background-color: #f1f5f9; padding: 40px 0; }
			.container { max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
			.header { background: linear-gradient(135deg, #0e7490 0%, #0891b2 100%); padding: 32px 24px; text-align: center; }
			.header h1 { margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
			.content { padding: 36px 32px; color: #334155; line-height: 1.6; }
			.content h2 { margin-top: 0; color: #0f172a; font-size: 18px; font-weight: 600; }
			.content p { font-size: 14px; margin: 16px 0; }
			.warning-card { background-color: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 6px; margin: 24px 0; }
			.warning-card p { margin: 0; font-size: 13px; color: #991b1b; }
			.divider { height: 1px; background-color: #f1f5f9; margin: 32px 0 20px 0; }
			.footer { padding: 0 32px 32px 32px; text-align: center; color: #94a3b8; font-size: 12px; }
			.footer p { margin: 4px 0; }
		</style>
	</head>
	<body>
		<div class="wrapper">
			<div class="container">
				<div class="header">
					<h1>Quirón Autoasignación</h1>
				</div>
				<div class="content">
					<h2>Contraseña Actualizada</h2>
					<p>Te confirmamos que la contraseña de tu cuenta en la plataforma de autoasignación ha sido actualizada exitosamente.</p>
					<div class="warning-card">
						<p><strong>Aviso de seguridad:</strong> Si tú no realizaste este cambio, por favor ponte en contacto inmediatamente con el centro médico para proteger tu cuenta.</p>
					</div>
					<div class="divider"></div>
					<p style="font-size: 12px; color: #64748b; margin-bottom: 0;">Si fuiste tú quien realizó el cambio, no es necesario que tomes ninguna acción adicional.</p>
				</div>
				<div class="footer">
					<p>&copy; ${new Date().getFullYear()} Quirón Instituciones. Todos los derechos reservados.</p>
					<p>Este es un correo automático, por favor no respondas a este mensaje.</p>
				</div>
			</div>
		</div>
	</body>
	</html>
	`;

  return sendEmail(
    clientId,
    email,
    "Notificación de cambio de contraseña - Quirón",
    body,
  );
}
