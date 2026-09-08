endpoint "GET /api/v1/agenda" {
  description = "Consulta la disponibilidad de cupos en agenda por fecha paginada."

  request {
    query {
      field "fecha" {
        type     = string
        required = true
      }
      field "id_sede" {
        type     = int
        required = true
      }
      field "id_cliente" {
        type     = int
        required = true
      }
      field "id_profesional" {
        type    = int
        default = 0
      }
      field "id_servicio" {
        type    = int
        default = 0
      }
      field "id_actividad" {
        type    = int
        default = 0
      }
      field "page" {
        type    = int
        default = 1
      }
      field "page_size" {
        type    = int
        default = 50
      }
    }
  }

  pipeline {
    sql "consultar_agenda" {
      connection = connection.sqlserver.main
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
}

endpoint "GET /api/v1/agenda/fechas-disponibles" {
  description = "Consulta las fechas que tienen cupos disponibles desde hoy."

  request {
    query {
      field "id_cliente" {
        type     = int
        required = true
      }
      field "id_sede" {
        type    = int
        default = 0
      }
      field "id_servicio" {
        type    = int
        default = 0
      }
    }
  }

  pipeline {
    sql "consultar_fechas" {
      connection = connection.sqlserver.main
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
}