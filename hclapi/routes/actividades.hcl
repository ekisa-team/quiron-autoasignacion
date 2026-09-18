route "GET /api/v1/actividades" {
  summary = "Consulta actividades filtradas por servicio o todas si id_servicio es 0"
  tag     = "catalogos"

  request {
    query "id_cliente" {
      type     = integer
      required = true
    }
    query "id_servicio" {
      type    = integer
      default = 0
    }
  }

  sql "consultar_actividades" {
    connection = "main"
    query      = "EXEC dbo.Proc_Aut_ConsultarActividadesPorServicio @IdCliente, @IdServicio"
    args = {
      IdCliente  = ctx.request.query.id_cliente
      IdServicio = ctx.request.query.id_servicio
    }
  }

  respond {
    status = 200
    body   = steps.consultar_actividades.rows
  }
}