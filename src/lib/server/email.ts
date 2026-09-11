import { env } from "$env/dynamic/private";
import type { TenantConfig } from "$lib/types/tenant";
import { formatDate, formatTime } from "$lib/utils";
import nodemailer from "nodemailer";
import { apiGet } from "./api";

interface EmailParams {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  display: string;
  enableSsl: boolean;
}

interface SmtpApiResponse {
  EmailServidorSmtp?: string;
  EmailPuertoSmtp?: number;
  EmailUsuarioSmtp?: string;
  EmailPasswordSmtp?: string;
  EmailHabilitarSsl?: boolean;
  EmailNombreRemitente?: string;
}

export interface SendPasswordResetEmailParams {
  clientId: number;
  email: string;
  identification: string;
  token: string;
  originUrl?: string;
  tunnelUrl?: string;
  tenant?: TenantConfig;
}

export interface SendRegistrationVerificationEmailParams {
  clientId: number;
  email: string;
  fullName: string;
  identification: string;
  token: string;
  originUrl?: string;
  tunnelUrl?: string;
  tenant?: TenantConfig;
}

export interface SendPasswordChangeNotificationParams {
  clientId: number;
  email: string;
  originUrl?: string;
  tunnelUrl?: string;
  tenant?: TenantConfig;
}

export interface SendAppointmentEmailParams {
  clientId: number;
  email: string;
  patientName: string;
  activityName: string;
  professionalName: string;
  date: string;
  time: string;
  venueName: string;
  originUrl?: string;
  tunnelUrl?: string;
  tenant?: TenantConfig;
}

function resolveEmailPrimaryColor(tenant?: TenantConfig): string {
  const color = tenant?.theme?.variables?.["--primary"];
  if (color && (color.startsWith("#") || color.startsWith("rgb"))) {
    return color;
  }
  return "#004B87";
}

function resolveEmailLogoUrl(
  baseUrl: string,
  logoPath?: string,
): string | null {
  if (!logoPath) return null;
  if (logoPath.startsWith("http://") || logoPath.startsWith("https://")) {
    return logoPath;
  }
  const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = logoPath.startsWith("/") ? logoPath : `/${logoPath}`;
  return `${cleanBase}${cleanPath}`;
}

async function getEmailConfig(
  tunnelUrl: string,
  clientId: number,
  tenantName?: string,
): Promise<EmailParams | null> {
  try {
    const row = await apiGet<SmtpApiResponse>(
      tunnelUrl,
      "/configuracion/parametros-envio",
      { id_cliente: clientId },
    );

    if (!row || !row.EmailUsuarioSmtp || !row.EmailPasswordSmtp) {
      return null;
    }

    return {
      host: row.EmailServidorSmtp || "smtp.gmail.com",
      port: row.EmailPuertoSmtp || 587,
      user: row.EmailUsuarioSmtp,
      pass: row.EmailPasswordSmtp,
      from: row.EmailUsuarioSmtp,
      display: row.EmailNombreRemitente || tenantName || "Quirón Instituciones",
      enableSsl: row.EmailHabilitarSsl ?? true,
    };
  } catch {
    return null;
  }
}

export async function sendEmail(
  clientId: number,
  to: string,
  subject: string,
  htmlBody: string,
  tunnelUrl: string,
  tenantName?: string,
): Promise<boolean> {
  try {
    if (!to || !to.trim()) return false;
    const cfg = await getEmailConfig(tunnelUrl, clientId, tenantName);
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
  } catch {
    return false;
  }
}

export async function sendRegistrationVerificationEmail(
  params: SendRegistrationVerificationEmailParams,
): Promise<boolean> {
  const {
    clientId,
    email,
    fullName,
    identification,
    token,
    originUrl,
    tunnelUrl,
    tenant,
  } = params;

  if (!tunnelUrl) {
    throw new Error("Tunnel URL is required");
  }

  const baseUrl = originUrl || env.PUBLIC_BASE_URL || "http://localhost:5173";
  const link = `${baseUrl}/verify-email?t=${token}&p=${identification}`;
  const tenantName = tenant?.name || "Quirón Autoasignación";
  const primaryColor = resolveEmailPrimaryColor(tenant);
  const logoUrl = resolveEmailLogoUrl(baseUrl, tenant?.logoUrl);
  const showLogo = logoUrl && !logoUrl.endsWith(".svg");

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
			.header { background-color: ${primaryColor}; padding: 32px 24px; text-align: center; color: #ffffff; }
			.header h1 { margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
			.content { padding: 36px 32px; color: #334155; line-height: 1.6; }
			.content h2 { margin-top: 0; color: #0f172a; font-size: 18px; font-weight: 600; }
			.content p { font-size: 14px; margin: 16px 0; }
			.btn-wrapper { text-align: center; margin: 32px 0; }
			.btn { display: inline-block; background-color: ${primaryColor}; color: #ffffff !important; text-decoration: none; padding: 13px 32px; border-radius: 6px; font-size: 14px; font-weight: 600; letter-spacing: 0.2px; }
			.divider { height: 1px; background-color: #f1f5f9; margin: 32px 0 20px 0; }
			.footer { padding: 0 32px 32px 32px; text-align: center; color: #94a3b8; font-size: 12px; }
			.footer p { margin: 4px 0; }
		</style>
	</head>
	<body>
		<div class="wrapper">
			<div class="container">
				<div class="header">
					${showLogo ? `<img src="${logoUrl}" alt="${tenantName}" style="max-height: 46px; max-width: 180px; margin-bottom: 12px; display: inline-block;" /><br/>` : ""}
					<h1>${tenantName}</h1>
				</div>
				<div class="content">
					<h2>¡Bienvenido, ${fullName}!</h2>
					<p>Has registrado exitosamente tu cuenta en nuestra plataforma de citas médicas. Para activar tu acceso y garantizar la seguridad de tus datos, por favor confirma tu correo electrónico.</p>
					<div class="btn-wrapper">
						<a href="${link}" class="btn" target="_blank">Verificar mi cuenta</a>
					</div>
					<p style="font-size: 12px; color: #64748b;">Si no puedes hacer clic en el botón, copia y pega el siguiente enlace en tu navegador:</p>
					<p style="font-size: 11px; word-break: break-all; color: ${primaryColor};">${link}</p>
					<div class="divider"></div>
					<p style="font-size: 12px; color: #64748b; margin-bottom: 0;">Si tú no solicitaste este registro, puedes ignorar este mensaje.</p>
				</div>
				<div class="footer">
					<p>&copy; ${new Date().getFullYear()} ${tenantName}. Todos los derechos reservados.</p>
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
    `Verificación de registro - ${tenantName}`,
    body,
    tunnelUrl,
    tenantName,
  );
}

export async function sendPasswordResetEmail(
  params: SendPasswordResetEmailParams,
): Promise<boolean> {
  const {
    clientId,
    email,
    identification,
    token,
    originUrl,
    tunnelUrl,
    tenant,
  } = params;

  if (!tunnelUrl) {
    throw new Error("Tunnel URL is required");
  }

  const baseUrl = originUrl || env.PUBLIC_BASE_URL || "http://localhost:5173";
  const link = `${baseUrl}/reset-password?t=${token}&i=${identification}`;
  const tenantName = tenant?.name || "Quirón Autoasignación";
  const primaryColor = resolveEmailPrimaryColor(tenant);
  const logoUrl = resolveEmailLogoUrl(baseUrl, tenant?.logoUrl);
  const showLogo = logoUrl && !logoUrl.endsWith(".svg");

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
			.header { background: linear-gradient(135deg, #0e7490 0%, #0891b2 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
			.header h1 { margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
			.content { padding: 36px 32px; color: #334155; line-height: 1.6; }
			.content h2 { margin-top: 0; color: #0f172a; font-size: 18px; font-weight: 600; }
			.content p { font-size: 14px; margin: 16px 0; }
			.alert-box { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 20px 0; border-radius: 0 4px 4px 0; }
			.alert-box p { margin: 0; font-size: 12px; color: #92400e; }
			.btn-wrapper { text-align: center; margin: 32px 0; }
			.btn { display: inline-block; background-color: ${primaryColor}; color: #ffffff !important; text-decoration: none; padding: 13px 32px; border-radius: 6px; font-size: 14px; font-weight: 600; letter-spacing: 0.2px; }
			.divider { height: 1px; background-color: #f1f5f9; margin: 32px 0 20px 0; }
			.footer { padding: 0 32px 32px 32px; text-align: center; color: #94a3b8; font-size: 12px; }
			.footer p { margin: 4px 0; }
		</style>
	</head>
	<body>
		<div class="wrapper">
			<div class="container">
				<div class="header">
					${showLogo ? `<img src="${logoUrl}" alt="${tenantName}" style="max-height: 46px; max-width: 180px; margin-bottom: 12px; display: inline-block;" /><br/>` : ""}
					<h1>${tenantName}</h1>
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
					<p style="font-size: 11px; word-break: break-all; color: ${primaryColor};">${link}</p>
					<div class="divider"></div>
					<p style="font-size: 12px; color: #64748b; margin-bottom: 0;">Si tú no solicitaste este cambio, puedes ignorar este mensaje con total tranquilidad.</p>
				</div>
				<div class="footer">
					<p>&copy; ${new Date().getFullYear()} ${tenantName}. Todos los derechos reservados.</p>
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
    `Restablecer contraseña - ${tenantName}`,
    body,
    tunnelUrl,
    tenantName,
  );
}

export async function sendPasswordChangeNotification(
  params: SendPasswordChangeNotificationParams,
): Promise<boolean> {
  const { clientId, email, originUrl, tunnelUrl, tenant } = params;

  if (!tunnelUrl) {
    throw new Error("Tunnel URL is required");
  }
  const baseUrl = originUrl || env.PUBLIC_BASE_URL || "http://localhost:5173";
  const tenantName = tenant?.name || "Quirón Autoasignación";
  const primaryColor = resolveEmailPrimaryColor(tenant);
  const logoUrl = resolveEmailLogoUrl(baseUrl, tenant?.logoUrl);
  const showLogo = logoUrl && !logoUrl.endsWith(".svg");

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
			.header { background-color: ${primaryColor}; padding: 32px 24px; text-align: center; color: #ffffff; }
			.header h1 { margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
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
					${showLogo ? `<img src="${logoUrl}" alt="${tenantName}" style="max-height: 46px; max-width: 180px; margin-bottom: 12px; display: inline-block;" /><br/>` : ""}
					<h1>${tenantName}</h1>
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
					<p>&copy; ${new Date().getFullYear()} ${tenantName}. Todos los derechos reservados.</p>
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
    `Notificación de cambio de contraseña - ${tenantName}`,
    body,
    tunnelUrl,
    tenantName,
  );
}

export async function sendAppointmentConfirmationEmail(
  params: SendAppointmentEmailParams,
): Promise<boolean> {
  const {
    clientId,
    email,
    patientName,
    activityName,
    professionalName,
    date,
    time,
    venueName,
    originUrl,
    tunnelUrl,
    tenant,
  } = params;

  if (!tunnelUrl) {
    throw new Error("Tunnel URL is required");
  }

  const baseUrl = originUrl || env.PUBLIC_BASE_URL || "http://localhost:5173";
  const tenantName = tenant?.name || "Quirón Autoasignación";
  const primaryColor = resolveEmailPrimaryColor(tenant);
  const logoUrl = resolveEmailLogoUrl(baseUrl, tenant?.logoUrl);
  const showLogo = logoUrl && !logoUrl.endsWith(".svg");

  const body = `
	<!DOCTYPE html>
	<html lang="es">
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>Confirmación de Cita</title>
		<style>
			body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
			.wrapper { width: 100%; table-layout: fixed; background-color: #f1f5f9; padding: 40px 0; }
			.container { max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
			.header { background-color: ${primaryColor}; padding: 32px 24px; text-align: center; color: #ffffff; }
			.header h1 { margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
			.content { padding: 36px 32px; color: #334155; line-height: 1.6; }
			.content h2 { margin-top: 0; color: #0f172a; font-size: 18px; font-weight: 600; }
			.content p { font-size: 14px; margin: 16px 0; }
			.details-box { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 6px; margin: 24px 0; }
			.details-box ul { list-style: none; padding: 0; margin: 0; }
			.details-box li { margin-bottom: 12px; font-size: 14px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; }
			.details-box li:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
			.details-box strong { color: #0f172a; display: inline-block; width: 120px; }
			.divider { height: 1px; background-color: #f1f5f9; margin: 32px 0 20px 0; }
			.footer { padding: 0 32px 32px 32px; text-align: center; color: #94a3b8; font-size: 12px; }
			.footer p { margin: 4px 0; }
		</style>
	</head>
	<body>
		<div class="wrapper">
			<div class="container">
				<div class="header">
					${showLogo ? `<img src="${logoUrl}" alt="${tenantName}" style="max-height: 46px; max-width: 180px; margin-bottom: 12px; display: inline-block;" /><br/>` : ""}
					<h1>${tenantName}</h1>
				</div>
				<div class="content">
					<h2>Cita Médica Confirmada</h2>
					<p>Estimado/a <strong>${patientName}</strong>, tu cita ha sido asignada exitosamente en nuestro sistema.</p>
					
					<div class="details-box">
						<ul>
							<li><strong>Especialidad:</strong> ${activityName}</li>
							<li><strong>Profesional:</strong> ${professionalName}</li>
							<li><strong>Fecha:</strong> ${formatDate(date)}</li>
							<li><strong>Hora:</strong> ${formatTime(time)}</li>
							<li><strong>Sede:</strong> ${venueName}</li>
						</ul>
					</div>
					
					<p>Por favor, preséntate 15 minutos antes de tu cita con tu documento de identidad.</p>
					<div class="divider"></div>
					<p style="font-size: 12px; color: #64748b; margin-bottom: 0;">Si necesitas cancelar o reprogramar, ingresa a la plataforma.</p>
				</div>
				<div class="footer">
					<p>&copy; ${new Date().getFullYear()} ${tenantName}. Todos los derechos reservados.</p>
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
    `Confirmación de Cita - ${tenantName}`,
    body,
    tunnelUrl,
    tenantName,
  );
}

export async function sendAppointmentCancellationEmail(
  params: SendAppointmentEmailParams,
): Promise<boolean> {
  const {
    clientId,
    email,
    patientName,
    activityName,
    professionalName,
    date,
    time,
    venueName,
    originUrl,
    tunnelUrl,
    tenant,
  } = params;

  if (!tunnelUrl) {
    throw new Error("Tunnel URL is required");
  }

  const baseUrl = originUrl || env.PUBLIC_BASE_URL || "http://localhost:5173";
  const tenantName = tenant?.name || "Quirón Autoasignación";
  const logoUrl = resolveEmailLogoUrl(baseUrl, tenant?.logoUrl);
  const showLogo = logoUrl && !logoUrl.endsWith(".svg");

  const body = `
	<!DOCTYPE html>
	<html lang="es">
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>Cancelación de Cita</title>
		<style>
			body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
			.wrapper { width: 100%; table-layout: fixed; background-color: #f1f5f9; padding: 40px 0; }
			.container { max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
			.header { background-color: #e11d48; padding: 32px 24px; text-align: center; color: #ffffff; }
			.header h1 { margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
			.content { padding: 36px 32px; color: #334155; line-height: 1.6; }
			.content h2 { margin-top: 0; color: #0f172a; font-size: 18px; font-weight: 600; }
			.content p { font-size: 14px; margin: 16px 0; }
			.details-box { background-color: #fff1f2; border: 1px solid #fecdd3; padding: 20px; border-radius: 6px; margin: 24px 0; }
			.details-box ul { list-style: none; padding: 0; margin: 0; }
			.details-box li { margin-bottom: 12px; font-size: 14px; border-bottom: 1px solid #fecdd3; padding-bottom: 12px; color: #881337; }
			.details-box li:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
			.details-box strong { color: #881337; display: inline-block; width: 120px; }
			.divider { height: 1px; background-color: #f1f5f9; margin: 32px 0 20px 0; }
			.footer { padding: 0 32px 32px 32px; text-align: center; color: #94a3b8; font-size: 12px; }
			.footer p { margin: 4px 0; }
		</style>
	</head>
	<body>
		<div class="wrapper">
			<div class="container">
				<div class="header">
					${showLogo ? `<img src="${logoUrl}" alt="${tenantName}" style="max-height: 46px; max-width: 180px; margin-bottom: 12px; display: inline-block;" /><br/>` : ""}
					<h1>${tenantName}</h1>
				</div>
				<div class="content">
					<h2>Cancelación de Cita</h2>
					<p>Estimado/a <strong>${patientName}</strong>, te confirmamos que la siguiente cita ha sido cancelada en nuestro sistema.</p>
					
					<div class="details-box">
						<ul>
							<li><strong>Especialidad:</strong> ${activityName}</li>
							<li><strong>Profesional:</strong> ${professionalName}</li>
							<li><strong>Fecha:</strong> ${formatDate(date)}</li>
							<li><strong>Hora:</strong> ${formatTime(time)}</li>
							<li><strong>Sede:</strong> ${venueName}</li>
						</ul>
					</div>
					
					<div class="divider"></div>
					<p style="font-size: 12px; color: #64748b; margin-bottom: 0;">Esperamos poder atenderte en una próxima oportunidad.</p>
				</div>
				<div class="footer">
					<p>&copy; ${new Date().getFullYear()} ${tenantName}. Todos los derechos reservados.</p>
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
    `Cancelación de Cita - ${tenantName}`,
    body,
    tunnelUrl,
    tenantName,
  );
}
