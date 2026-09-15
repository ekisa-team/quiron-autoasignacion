route "GET /api/v1/agenda" {
  summary = "Consulta la disponibilidad de cupos en agenda por fecha paginada"
  tag     = "agenda"

  request {
    query "fecha" {
      type     = "string"
      required = true
    }
    query "id_sede" {
      type     = "integer"
      required = true
    }
    query "id_cliente" {
      type     = "integer"
      required = true
    }
    query "id_profesional" {
      type    = "integer"
      default = 0
    }
    query "id_servicio" {
      type    = "integer"
      default = 0
    }
    query "id_actividad" {
      type    = "integer"
      default = 0
    }
    query "page" {
      type    = "integer"
      default = 1
    }
    query "page_size" {
      type    = "integer"
      default = 50
    }
  }

  step "sql" "consultar_agenda" {
    connection = "main"
    query      = "EXEC dbo.Proc_Aut_AgendaCitas @FechaC, @IdSede, @IdCliente, @IdProfesional, @IdServicio, @IdActividad, @PageNumber, @PageSize"
    args = {
      FechaC        = ctx.request.query.fecha
      IdSede        = ctx.request.query.id_sede
      IdCliente     = ctx.request.query.id_cliente
      IdProfesional = ctx.request.query.id_profesional
      IdServicio    = ctx.request.query.id_servicio
      IdActividad   = ctx.request.query.id_actividad
      PageNumber    = ctx.request.query.page
      PageSize      = ctx.request.query.page_size
    }
  }

  respond {
    status = 200
    body   = steps.consultar_agenda.rows
  }
}

route "GET /api/v1/agenda/fechas-disponibles" {
  summary = "Consulta las fechas que tienen cupos disponibles desde hoy"
  tag     = "agenda"

  request {
    query "id_cliente" {
      type     = "integer"
      required = true
    }
    query "id_sede" {
      type    = "integer"
      default = 0
    }
    query "id_servicio" {
      type    = "integer"
      default = 0
    }
  }

  step "sql" "consultar_fechas" {
    connection = "main"
    query      = "EXEC dbo.Proc_Aut_ConsultarFechasDisponibles @IdCliente, @IdSede, @IdServicio"
    args = {
      IdCliente  = ctx.request.query.id_cliente
      IdSede     = ctx.request.query.id_sede
      IdServicio = ctx.request.query.id_servicio
    }
  }

  respond {
    status = 200
    body   = steps.consultar_fechas.rows
  }
}