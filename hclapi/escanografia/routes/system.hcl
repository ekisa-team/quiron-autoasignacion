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