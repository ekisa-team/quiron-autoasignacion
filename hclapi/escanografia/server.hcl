server {
  host          = "0.0.0.0"
  port          = 8080
  read_timeout  = "30s"
  write_timeout = "60s"
  max_body_size = "10MB"

  openapi {
    title   = "Quiron Autoasignación API"
    version = "1.0.0"

    description = <<-MARKDOWN
      ## Portal de autoasignación de citas médicas - Quirón
      API REST de alto rendimiento para la consulta de sedes, profesionales, agenda médica disponible, reserva de citas y autenticación de pacientes.
    MARKDOWN

    servers = [
      {
        url         = "http://localhost:8080"
        description = "Servidor Local / Gateway"
      }
    ]

    tags = [
      {
        name        = "auth"
        description = "Autenticación y gestión de credenciales de pacientes"
      },
      {
        name        = "catalogos"
        description = "Consulta de sedes, profesionales, servicios y actividades"
      },
      {
        name        = "agenda"
        description = "Consulta de disponibilidad de cupos y horarios médicos"
      },
      {
        name        = "citas"
        description = "Reserva, consulta y cancelación de citas médicas"
      },
      {
        name        = "system"
        description = "Monitoreo y diagnóstico del sistema"
      }
    ]

    contact {
      name  = "Soporte TI Ekisa / Quirón"
      email = "soporte@ekisa.com.co"
      url   = "https://www.ekisa.com.co"
    }

    license {
      name = "Proprietary"
    }
  }
}