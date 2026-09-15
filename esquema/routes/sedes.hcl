route "GET /api/v1/sedes" {
  summary = "Consulta las sedes de atención médica de la clínica"
  tag     = "catalogos"

  request {
    query "id_cliente" {
      type     = "integer"
      required = true
    }
  }

  step "sql" "consultar_sedes" {
    connection = "main"
    query      = "EXEC dbo.Proc_Autoasignacion_ConsultarSedes @IdCliente"
    args = {
      IdCliente = ctx.request.query.id_cliente
    }
  }

  respond {
    status = 200
    body   = steps.consultar_sedes.rows
  }
}