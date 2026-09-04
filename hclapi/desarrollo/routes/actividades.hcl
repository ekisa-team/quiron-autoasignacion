endpoint "GET /api/v1/actividades" {
  description = "Consulta actividades filtradas por servicio o todas si id_servicio es 0."

  request {
    query {
      field "id_cliente" {
        type     = int
        required = true
      }
      field "id_servicio" {
        type    = int
        default = 0
      }
    }
  }

  pipeline {
    sql "consultar_actividades" {
      connection = connection.sqlserver.main
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
}