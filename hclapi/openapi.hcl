openapi {
  title       = "Quiron Autoasignación API"
  version     = "1.0.0"
  description = <<-MARKDOWN
    ## Portal de autoasignación de citas médicas - Quirón
    API REST de alto rendimiento para la consulta de sedes, profesionales, agenda médica disponible, reserva de citas y autenticación de pacientes.
  MARKDOWN

  servers = [
    {
      url         = "/hclapi"
      description = "Host actual (Proxy /hclapi)"
    },
    {
      url         = "https://ekisa-autoasignacion.relay.ekisa.com.co"
      description = "Servidor Relay / Producción"
    },
    {
      url         = "http://localhost:8080"
      description = "Servidor Local / Desarrollo"
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

route "GET /docs" {
  summary = "Portal interactivo de documentación de la API"
  tag     = "system"

  docs {
    renderer = "elements"
    spec_url = "/hclapi/openapi.json"
  }
}

route "GET /openapi.json" {
  summary = "Especificación OpenAPI 3.1 en formato JSON"
  tag     = "system"

  spec {
    format = "json"
  }
}

route "GET /openapi.yaml" {
  summary = "Especificación OpenAPI 3.1 en formato YAML"
  tag     = "system"

  spec {
    format = "yaml"
  }
}