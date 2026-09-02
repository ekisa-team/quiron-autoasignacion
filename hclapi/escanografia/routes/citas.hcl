schema "grabar_cita_request" {
  field "fecha_servicio" {
    type        = string
    required    = true
    format      = "date"
    description = "Fecha de la cita (YYYY-MM-DD)"
  }

  field "hora_servicio" {
    type        = string
    required    = true
    description = "Hora de la cita (HH:MM o HH:MM:SS)"
  }

  field "codigo_paciente" {
    type        = string
    required    = true
    description = "Código o historia del paciente"
  }

  field "id_profesional" {
    type        = int
    required    = true
    description = "Identificador del médico o profesional"
  }

  field "id_cliente" {
    type        = int
    required    = true
    description = "Identificador de la institución"
  }

  field "id_actividad_cita" {
    type        = int
    required    = true
    description = "Identificador del tipo de actividad o cita"
  }

  field "clave_cita" {
    type        = string
    required    = true
    description = "Clave o identificador único de reserva"
  }

  field "id_sede" {
    type        = int
    required    = true
    description = "Identificador de la sede médica"
  }

  field "edad" {
    type        = int
    required    = true
    min         = 0
    description = "Edad del paciente"
  }

  field "ume" {
    type        = string
    required    = true
    enum        = ["A", "M", "D"]
    description = "Unidad de medida de edad (A: Años, M: Meses, D: Días)"
  }
}

endpoint "POST /api/v1/citas" {
  description = "Reserva y graba una cita médica en la agenda de la clínica."

  request {
    body = schema.grabar_cita_request
  }

  pipeline {
    sql "grabar_cita" {
      connection = connection.sqlserver.main
      query      = "EXEC dbo.Proc_Aut_GrabarCitas @FechaServicio, @HoraServicio, @CodigoPaciente, @IdProfesional, @IdCliente, @IdActividadCita, @ClaveCita, @IdSede, @Edad, @UME"
      args = {
        FechaServicio   = ctx.request.body.fecha_servicio
        HoraServicio    = ctx.request.body.hora_servicio
        CodigoPaciente  = ctx.request.body.codigo_paciente
        IdProfesional   = ctx.request.body.id_profesional
        IdCliente       = ctx.request.body.id_cliente
        IdActividadCita = ctx.request.body.id_actividad_cita
        ClaveCita       = ctx.request.body.clave_cita
        IdSede          = ctx.request.body.id_sede
        Edad            = ctx.request.body.edad
        UME             = ctx.request.body.ume
      }

      # Captura de colisión de clave única o conflicto en SQL Server
      catch "2627" {
        status = 409
        body   = problem(409, "El cupo o la clave de cita ya se encuentra reservada", "cupo-no-disponible")
      }
      catch "2601" {
        status = 409
        body   = problem(409, "El cupo o la clave de cita ya se encuentra reservada", "cupo-no-disponible")
      }
    }

    respond {
      status = 201
      body = {
        status     = "created"
        message    = "Cita médica reservada exitosamente"
        clave_cita = ctx.request.body.clave_cita
      }
    }
  }
}

endpoint "DELETE /api/v1/citas/{clave_cita}" {
  description = "Cancela una cita médica y libera el cupo en la agenda."

  request {
    path {
      field "clave_cita" {
        type        = string
        required    = true
        description = "Clave única de la cita a cancelar"
      }
    }
  }

  pipeline {
    sql "cancelar_cita" {
      connection = connection.sqlserver.main
      query      = "EXEC dbo.Proc_Aut_CancelarCita @ClaveCita"
      args = {
        ClaveCita = ctx.request.path.clave_cita
      }
    }

    respond {
      status = 200
      body = {
        status     = "success"
        message    = "Cita cancelada y cupo liberado"
        clave_cita = ctx.request.path.clave_cita
      }
    }
  }
}