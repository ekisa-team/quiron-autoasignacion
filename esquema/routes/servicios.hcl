route "GET /api/v1/servicios" {
  summary = "Consulta los servicios médicos disponibles"
  tag     = "catalogos"

  request {
    query "id_cliente" {
      type     = "integer"
      required = true
    }
  }

  step "sql" "consultar_servicios" {
    connection = "main"
    query      = "EXEC dbo.Proc_Aut_ConsultarServicios @IdCliente"
    args = {
      IdCliente = ctx.request.query.id_cliente
    }
  }

  respond {
    status = 200
    body   = steps.consultar_servicios.rows
  }
}