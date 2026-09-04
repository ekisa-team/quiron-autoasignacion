endpoint "GET /api/v1/profesionales" {
  description = "Consulta la lista de profesionales y médicos disponibles."

  request {
    query {
      field "id_cliente" {
        type     = int
        required = true
      }
    }
  }

  pipeline {
    sql "consultar_profesionales" {
      connection = connection.sqlserver.main
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
}