import { apiPost } from "$lib/server/api";
import { sendRegistrationVerificationEmail } from "$lib/server/email";
import { generateSecureToken, hashPassword } from "$lib/server/password";
import { verifyTurnstileToken } from "$lib/server/turnstile";
import { error, json, type RequestHandler } from "@sveltejs/kit";

interface PatientRegisterApiResponse {
  Success?: number;
  Message?: string;
  CodigoPaciente?: number;
}

export const POST: RequestHandler = async ({
  request,
  locals,
  getClientAddress,
  url,
}) => {
  const tunnelUrl = locals.tenant?.apirUrl;
  if (!tunnelUrl) {
    error(500, "Tunnel url not found");
  }

  try {
    const body = await request.json();
    const clientId = Number(body.clientId) || locals.clientId;

    if (
      !body.turnstileToken ||
      !(await verifyTurnstileToken(body.turnstileToken, getClientAddress()))
    ) {
      return json(
        { success: false, message: "Verificación de seguridad fallida" },
        { status: 400 },
      );
    }

    const {
      documentType,
      identification,
      nombre1,
      nombre2 = "",
      apellido1,
      apellido2 = "",
      fechaNacimiento,
      sexo = "M",
      direccion = "",
      telefono = "",
      celular = "",
      email,
      password,
    } = body;

    if (
      !documentType ||
      !identification ||
      !nombre1 ||
      !apellido1 ||
      !email ||
      !password
    ) {
      return json(
        {
          success: false,
          message: "Todos los campos obligatorios deben ser diligenciados",
        },
        { status: 400 },
      );
    }

    const passwordHash = await hashPassword(password);
    const verificationToken = generateSecureToken(32);

    const result = await apiPost<PatientRegisterApiResponse>(
      tunnelUrl,
      "/pacientes/registro",
      {
        document_type: String(documentType).trim(),
        identification: String(identification).trim(),
        first_name: String(nombre1).trim(),
        second_name: String(nombre2).trim(),
        first_last_name: String(apellido1).trim(),
        second_last_name: String(apellido2).trim(),
        birth_date: String(fechaNacimiento).trim(),
        gender: String(sexo).trim().toUpperCase(),
        address: String(direccion).trim(),
        phone: String(telefono).trim(),
        mobile: String(celular).trim(),
        email: String(email).trim().toLowerCase(),
        password_hash: passwordHash,
        verification_token: verificationToken,
        client_id: clientId,
      },
    );

    if (!result.ok || result.data?.Success === 0) {
      return json(
        {
          success: false,
          message:
            result.data?.Message ||
            "Error al registrar el paciente en el sistema",
        },
        { status: 400 },
      );
    }

    const fullName = `${nombre1} ${apellido1}`.trim();
    sendRegistrationVerificationEmail({
      clientId,
      email,
      fullName,
      identification,
      token: verificationToken,
      originUrl: url.origin,
      tunnelUrl,
      tenant: locals.tenant,
    }).catch(() => {});

    return json({
      success: true,
      message: "Usuario y clave creados con éxito",
    });
  } catch (err) {
    error(500, JSON.stringify(err));
  }
};
