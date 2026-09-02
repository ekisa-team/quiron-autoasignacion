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
      query      = <<-SQL
        SELECT TOP 1 EmailServidorSmtp, EmailPuertoSmtp, EmailUsuarioSmtp, EmailPasswordSmtp, EmailHabilitarSsl, EmailNombreRemitente 
        FROM dbo.ParametrosEnvio 
        WHERE IdCliente = @IdCliente
      SQL
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
      query      = <<-SQL
        SELECT fechaCalendario 
        FROM dbo.Festivos
      SQL
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
      query      = <<-SQL
        SELECT codigoDocumento, nombreDocumento 
        FROM dbo.TiposDocumento 
        WHERE Proceso = 'PAC' ORDER BY orden ASC
      SQL
    }

    respond {
      status = 200
      body   = steps.consultar_tipos_doc.rows
    }
  }
}