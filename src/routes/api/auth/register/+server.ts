import { getTenantDb } from "$lib/server/db";
import { sendRegistrationVerificationEmail } from "$lib/server/email";
import { generateSecureToken, hashPassword } from "$lib/server/password";
import { verifyTurnstileToken } from "$lib/server/turnstile";
import { json, type RequestHandler } from "@sveltejs/kit";
import mssql from "mssql";

export const POST: RequestHandler = async ({
  request,
  locals,
  getClientAddress,
}) => {
  try {
    const body = await request.json();
    const clientId = Number(body.clientId) || locals.clientId;

    if (body.captchaToken) {
      const isCaptchaValid = await verifyTurnstileToken(
        body.captchaToken,
        getClientAddress(),
      );
      if (!isCaptchaValid) {
        return json(
          {
            success: false,
            message: "Verificación de seguridad (Captcha) fallida",
          },
          { status: 400 },
        );
      }
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

    const safeDoc = String(identification).trim().slice(0, 20);
    const safeDocType = String(documentType).trim().slice(0, 2);
    const safeN1 = String(nombre1).trim().slice(0, 30);
    const safeN2 = nombre2 ? String(nombre2).trim().slice(0, 30) : null;
    const safeA1 = String(apellido1).trim().slice(0, 30);
    const safeA2 = apellido2 ? String(apellido2).trim().slice(0, 30) : null;
    const safeSexo = String(sexo).trim().toUpperCase().slice(0, 1) || "M";
    const safeDir = direccion ? String(direccion).trim().slice(0, 120) : null;
    const safeTel = telefono ? String(telefono).trim().slice(0, 50) : null;
    const safeCel = celular ? String(celular).trim().slice(0, 25) : null;
    const safeEmail = String(email).trim().toLowerCase().slice(0, 50);

    const pool = await getTenantDb(clientId);

    let patReq = pool.request();
    patReq.input("doc", mssql.VarChar(20), safeDoc);
    patReq.input("clientId", mssql.Int, clientId);

    let patRes = await patReq.query(`
			SELECT TOP 1 CodigoPaciente, IdentificacionPaciente, CorreoPaciente 
			FROM dbo.Pacientes 
			WHERE IdentificacionPaciente = @doc AND IdCliente = @clientId
		`);

    let patientCode: number;

    if (patRes.recordset.length > 0) {
      patientCode = patRes.recordset[0].CodigoPaciente;

      const updatePat = pool.request();
      updatePat.input("code", mssql.Int, patientCode);
      updatePat.input("docType", mssql.VarChar(2), safeDocType);
      updatePat.input("n1", mssql.VarChar(30), safeN1);
      updatePat.input("n2", mssql.VarChar(30), safeN2);
      updatePat.input("a1", mssql.VarChar(30), safeA1);
      updatePat.input("a2", mssql.VarChar(30), safeA2);
      updatePat.input(
        "fNac",
        mssql.DateTime,
        fechaNacimiento ? new Date(fechaNacimiento) : null,
      );
      updatePat.input("sexo", mssql.Char(1), safeSexo);
      updatePat.input("dir", mssql.VarChar(120), safeDir);
      updatePat.input("tel", mssql.VarChar(50), safeTel);
      updatePat.input("cel", mssql.VarChar(25), safeCel);
      updatePat.input("email", mssql.VarChar(50), safeEmail);

      await updatePat.query(`
				UPDATE dbo.Pacientes 
				SET CodigoTipoDocumento = @docType,
				    Nombre1Paciente = @n1,
				    Nombre2Paciente = @n2,
				    Apellido1Paciente = @a1,
				    Apellido2Paciente = @a2,
				    FechaNacimientoPaciente = @fNac,
				    SexoPaciente = @sexo,
				    DireccionPaciente = @dir,
				    TelefonoPaciente = @tel,
				    CelularPaciente = @cel,
				    CorreoPaciente = @email
				WHERE CodigoPaciente = @code
			`);
    } else {
      const insertPat = pool.request();
      insertPat.input("doc", mssql.VarChar(20), safeDoc);
      insertPat.input("docType", mssql.VarChar(2), safeDocType);
      insertPat.input("n1", mssql.VarChar(30), safeN1);
      insertPat.input("n2", mssql.VarChar(30), safeN2);
      insertPat.input("a1", mssql.VarChar(30), safeA1);
      insertPat.input("a2", mssql.VarChar(30), safeA2);
      insertPat.input(
        "fNac",
        mssql.DateTime,
        fechaNacimiento ? new Date(fechaNacimiento) : null,
      );
      insertPat.input("sexo", mssql.Char(1), safeSexo);
      insertPat.input("dir", mssql.VarChar(120), safeDir);
      insertPat.input("tel", mssql.VarChar(50), safeTel);
      insertPat.input("cel", mssql.VarChar(25), safeCel);
      insertPat.input("email", mssql.VarChar(50), safeEmail);
      insertPat.input("clientId", mssql.Int, clientId);

      const newPatRes = await insertPat.query(`
				INSERT INTO dbo.Pacientes (
					IdentificacionPaciente, CodigoTipoDocumento, Nombre1Paciente, Nombre2Paciente,
					Apellido1Paciente, Apellido2Paciente, FechaNacimientoPaciente, SexoPaciente,
					DireccionPaciente, TelefonoPaciente, CelularPaciente, CorreoPaciente, IdCliente
				) OUTPUT INSERTED.CodigoPaciente VALUES (
					@doc, @docType, @n1, @n2,
					@a1, @a2, @fNac, @sexo,
					@dir, @tel, @cel, @email, @clientId
				)
			`);

      patientCode = newPatRes.recordset[0].CodigoPaciente;
    }

    const userReq = pool.request();
    userReq.input("patientId", mssql.Int, patientCode);
    userReq.input("clientId", mssql.Int, clientId);
    const userRes = await userReq.query(`
			SELECT TOP 1 Id FROM dbo.UsuarioPaciente WHERE PatientId = @patientId AND ClientId = @clientId
		`);

    if (userRes.recordset.length > 0) {
      return json(
        {
          success: false,
          message:
            "Este paciente ya tiene una clave creada. Puedes iniciar sesión o restablecerla.",
        },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);
    const verificationToken = generateSecureToken(32);

    const insertUser = pool.request();
    insertUser.input("patientId", mssql.Int, patientCode);
    insertUser.input("clientId", mssql.Int, clientId);
    insertUser.input("hash", mssql.VarChar(255), passwordHash);
    insertUser.input("token", mssql.VarChar(255), verificationToken);

    await insertUser.query(`
			INSERT INTO dbo.UsuarioPaciente (
				PatientId, ClientId, PasswordHash, EmailVerified, PhoneVerified,
				CreatedAt, UpdatedAt, EmailVerificationToken, EmailVerificationExpiresAt
			) VALUES (
				@patientId, @clientId, @hash, 0, 0,
				GETUTCDATE(), GETUTCDATE(), @token, DATEADD(hour, 24, GETUTCDATE())
			)
		`);

    const fullName = `${safeN1} ${safeA1}`.trim();
    await sendRegistrationVerificationEmail(
      clientId,
      safeEmail,
      fullName,
      safeDoc,
      verificationToken,
    );

    return json({
      success: true,
      message: "Usuario y clave creados con éxito",
    });
  } catch (error: any) {
    console.error("[API Register DDL Error]:", error);
    return json(
      { success: false, message: "Error interno al registrar paciente" },
      { status: 500 },
    );
  }
};
