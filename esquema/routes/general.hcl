route "GET /api/v1/configuracion/parametros-envio" {
  summary = "Consulta configuracion SMTP de la clinica"
  tag     = "catalogos"

  request {
    query "id_cliente" {
      type     = "integer"
      required = true
    }
  }

  step "sql" "consultar_smtp" {
    connection = "main"
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

route "GET /api/v1/lookups/holidays" {
  summary = "Consulta festivos"
  tag     = "catalogos"

  step "sql" "consultar_festivos" {
    connection = "main"
    query      = "EXEC dbo.Proc_Aut_ConsultarFestivos"
  }

  respond {
    status = 200
    body   = steps.consultar_festivos.rows
  }
}

route "GET /api/v1/lookups/document-types" {
  summary = "Consulta tipos de documento"
  tag     = "catalogos"

  step "sql" "consultar_tipos_doc" {
    connection = "main"
    query      = "EXEC dbo.Proc_Aut_ConsultarTiposDocumento 'PAC'"
  }

  respond {
    status = 200
    body   = steps.consultar_tipos_doc.rows
  }
}

route "GET /api/v1/lookups/biological-sexes" {
  summary = "Consulta sexos biologicos"
  tag     = "catalogos"

  step "sql" "consultar_sexos" {
    connection = "main"
    query      = "EXEC dbo.Proc_Aut_ConsultarSexosBiologicos"
  }

  respond {
    status = 200
    body   = steps.consultar_sexos.rows
  }
}