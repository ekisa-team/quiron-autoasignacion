endpoint "GET /api/v1/configuracion/parametros-envio" {
  description = "Consulta configuracion SMTP de la clinica."

  request {
    query {
      field "id_cliente" {
        type     = int
        required = true
      }
    }
  }

  pipeline {
    sql "consultar_smtp" {
      connection = connection.sqlserver.main
      query      = "EXEC dbo.Proc_Aut_ConsultarParametrosEnvio @IdCliente"
      args = {
        IdCliente = ctx.request.query.id_cliente
      }
    }

    respond {
      status = 200
      body   = steps.consultar_smtp.row
    }
  }
}

endpoint "GET /api/v1/lookups/holidays" {
  description = "Consulta festivos."

  pipeline {
    sql "consultar_festivos" {
      connection = connection.sqlserver.main
      query      = "EXEC dbo.Proc_Aut_ConsultarFestivos"
    }

    respond {
      status = 200
      body   = steps.consultar_festivos.rows
    }
  }
}

endpoint "GET /api/v1/lookups/document-types" {
  description = "Consulta tipos de documento."

  pipeline {
    sql "consultar_tipos_doc" {
      connection = connection.sqlserver.main
      query      = "EXEC dbo.Proc_Aut_ConsultarTiposDocumento 'PAC'"
    }

    respond {
      status = 200
      body   = steps.consultar_tipos_doc.rows
    }
  }
}

endpoint "GET /api/v1/lookups/biological-sexes" {
  description = "Consulta sexos biologicos."

  pipeline {
    sql "consultar_sexos" {
      connection = connection.sqlserver.main
      query      = "EXEC dbo.Proc_Aut_ConsultarSexosBiologicos"
    }

    respond {
      status = 200
      body   = steps.consultar_sexos.rows
    }
  }
}