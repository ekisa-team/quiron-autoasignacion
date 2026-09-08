endpoint "GET /" {
  description = "Verificación de estado general del servicio."

  pipeline {
    respond {
      status = 200
      body = {
        app       = "Quiron Autoasignacion API"
        status    = "healthy"
        timestamp = now()
      }
    }
  }
}

endpoint "GET /health" {
  description = "Liveness probe para balanceadores de carga."

  pipeline {
    respond {
      status = 200
      body = {
        status    = "ok"
        timestamp = now()
      }
    }
  }
}

endpoint "GET /docs" {
  description = "Portal interactivo de documentación de la API."

  openapi "ui" {
    renderer = "elements"
  }
}

endpoint "GET /openapi.json" {
  openapi "spec" {
    format = "json"
  }
}

endpoint "GET /openapi.yaml" {
  openapi "spec" {
    format = "yaml"
  }
}