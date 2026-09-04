endpoint "GET /api/v1/servicios" {
  description = "Consulta los servicios médicos disponibles (Cit_Servicios)."

  request {
    query {
      field "id_cliente" {
        type     = int
        required = true
      }
    }
  }

  pipeline {
    sql "consultar_servicios" {
      connection = connection.sqlserver.main
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
}