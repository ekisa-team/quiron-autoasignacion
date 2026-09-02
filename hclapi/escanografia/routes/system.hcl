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

  openapi {
    ui = "elements"
  }
}

endpoint "GET /docs/scalar" {
  description = "Portal interactivo de documentación de la API."

  openapi {
    ui = "scalar"
  }
}

endpoint "GET /docs/swagger" {
  description = "Portal interactivo de documentación de la API."

  openapi {
    ui = "swagger"
  }
}

endpoint "GET /docs/redoc" {
  description = "Portal interactivo de documentación de la API."

  openapi {
    ui = "redoc"
  }
}

endpoint "GET /openapi.json" {
  openapi {
    format = "json"
  }
}

endpoint "GET /openapi.yaml" {
  openapi {
    format = "yaml"
  }
}