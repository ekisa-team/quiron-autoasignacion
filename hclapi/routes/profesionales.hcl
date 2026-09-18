route "GET /api/v1/profesionales" {
  summary = "Consulta la lista de profesionales y médicos disponibles"
  tag     = "catalogos"

  request {
    query "id_cliente" {
      type     = integer
      required = true
    }
  }

  sql "consultar_profesionales" {
    connection = "main"
    query      = "EXEC dbo.Proc_Autoasignacion_ConsultarProfesionales @IdCliente"
    args = {
      IdCliente = ctx.request.query.id_cliente
    }
  }

  respond {
    status = 200
    body   = steps.consultar_profesionales.rows
  }
}