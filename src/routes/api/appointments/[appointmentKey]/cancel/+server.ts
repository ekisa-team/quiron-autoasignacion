import { apiDelete } from "$lib/server/api";
import { json, type RequestHandler } from "@sveltejs/kit";

interface CancelApiResponse {
  status?: string;
  message?: string;
}

export const PUT: RequestHandler = async ({ params }) => {
  try {
    const appointmentKey = String(params.appointmentKey);

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

    return json({ success: true, message: "Cita cancelada correctamente" });
  } catch {
    return json(
      { success: false, message: "Error al cancelar la cita" },
      { status: 500 },
    );
  }
};
