import { apiDelete } from "$lib/server/api";
import { sendAppointmentCancellationEmail } from "$lib/server/email";
import { json, type RequestHandler } from "@sveltejs/kit";

interface CancelApiResponse {
  status?: string;
  message?: string;
}

export const PUT: RequestHandler = async ({ params, request, locals }) => {
  try {
    const appointmentKey = String(params.appointmentKey);
    const clientId = locals.clientId || 67;

    if (!appointmentKey) {
      return json(
        { success: false, message: "Clave de cita inválida" },
        { status: 400 },
      );
    }

    const result = await apiDelete<CancelApiResponse>(
      `/citas/${appointmentKey}`,
    );

    if (!result.ok) {
      return json(
        { success: false, message: "Error al cancelar la cita" },
        { status: 500 },
      );
    }

    const body = await request.json().catch(() => null);

    if (body && locals.user?.email) {
      sendAppointmentCancellationEmail({
        clientId,
        email: locals.user.email,
        patientName: locals.user.fullName,
        activityName: body.activityName || "Consulta Médica",
        professionalName: body.professionalName || "N/A",
        date: body.appointmentDate,
        time: body.appointmentTime,
        venueName: body.venueName || "Sede principal",
        tenant: locals.tenant,
        tunnelUrl: locals.tenant?.hclapiUrl,
      }).catch((e) => console.error("[Email Error]:", e));
    }

    return json({ success: true, message: "Cita cancelada correctamente" });
  } catch {
    return json(
      { success: false, message: "Error al cancelar la cita" },
      { status: 500 },
    );
  }
};
