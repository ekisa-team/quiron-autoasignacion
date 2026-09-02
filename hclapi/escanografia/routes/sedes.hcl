endpoint "GET /api/v1/sedes" {
  description = "Consulta las sedes de atención médica de la clínica."

  request {
    query {
      field "id_cliente" {
        type     = int
        required = true
      }
    }
  }

  pipeline {
    sql "consultar_sedes" {
      connection = connection.sqlserver.main
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
}