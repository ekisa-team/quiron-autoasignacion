route "GET /" {
  summary = "Verificación de estado general del servicio"
  tag     = "system"

  respond {
    status = 200
    body = {
      app       = "Quiron Autoasignacion API"
      status    = "healthy"
      timestamp = now()
    }
  }
}

route "GET /health" {
  summary = "Liveness probe para balanceadores de carga"
  tag     = "system"

  respond {
    status = 200
    body = {
      status    = "ok"
      timestamp = now()
    }
  }
}