schema "registro_paciente_request" {
  field "document_type" {
    type     = string
    required = true
  }
  field "identification" {
    type     = string
    required = true
  }
  field "first_name" {
    type     = string
    required = true
  }
  field "second_name" {
    type    = string
    default = ""
  }
  field "first_last_name" {
    type     = string
    required = true
  }
  field "second_last_name" {
    type    = string
    default = ""
  }
  field "birth_date" {
    type     = string
    required = true
  }
  field "gender" {
    type    = string
    default = "M"
  }
  field "address" {
    type    = string
    default = ""
  }
  field "phone" {
    type    = string
    default = ""
  }
  field "mobile" {
    type     = string
    required = true
  }
  field "email" {
    type     = string
    format   = "email"
    required = true
  }
  field "password_hash" {
    type     = string
    required = true
  }
  field "verification_token" {
    type     = string
    required = true
  }
  field "client_id" {
    type     = integer
    required = true
  }
}

route "POST /api/v1/pacientes/registro" {
  summary = "Registra paciente y usuario mediante Stored Procedure"
  tag     = "auth"

  request {
    body = registro_paciente_request
  }

  sql "registrar" {
    connection = "main"
    query      = <<-SQL
      EXEC dbo.Proc_Aut_RegistrarPacienteWeb 
        @Identificacion, 
        @CodigoTipoDocumento, 
        @Nombre1, 
        @Nombre2, 
        @Apellido1, 
        @Apellido2, 
        @FechaNacimiento, 
        @Sexo, 
        @Direccion, 
        @Telefono, 
        @Celular, 
        @Email, 
        @PasswordHash, 
        @VerificationToken, 
        @IdCliente
    SQL
    args = {
      Identificacion      = ctx.request.body.identification
      CodigoTipoDocumento = ctx.request.body.document_type
      Nombre1             = ctx.request.body.first_name
      Nombre2             = ctx.request.body.second_name
      Apellido1           = ctx.request.body.first_last_name
      Apellido2           = ctx.request.body.second_last_name
      FechaNacimiento     = ctx.request.body.birth_date
      Sexo                = ctx.request.body.gender
      Direccion           = ctx.request.body.address
      Telefono            = ctx.request.body.phone
      Celular             = ctx.request.body.mobile
      Email               = ctx.request.body.email
      PasswordHash        = ctx.request.body.password_hash
      VerificationToken   = ctx.request.body.verification_token
      IdCliente           = ctx.request.body.client_id
    }
  }

  respond {
    status = 200
    body   = steps.registrar.row
  }
}

route "GET /api/v1/pacientes/{codigo_paciente}/citas" {
  summary = "Consulta el historial de citas paginado de un paciente"
  tag     = "citas"

  request {
    path "codigo_paciente" {
      type     = integer
      required = true
    }
    query "id_cliente" {
      type     = integer
      required = true
    }
    query "tipo" {
      type    = string
      default = "TODAS"
    }
    query "page" {
      type    = integer
      default = 1
    }
    query "page_size" {
      type    = integer
      default = 5
    }
  }

  sql "consultar_citas_paciente" {
    connection = "main"
    query      = "EXEC dbo.Proc_Aut_ConsultarCitasPaciente @CodigoPaciente, @IdCliente, @TipoConsulta, @PageNumber, @PageSize"
    args = {
      CodigoPaciente = ctx.request.path.codigo_paciente
      IdCliente      = ctx.request.query.id_cliente
      TipoConsulta   = ctx.request.query.tipo
      PageNumber     = ctx.request.query.page
      PageSize       = ctx.request.query.page_size
    }
  }

  respond {
    status = 200
    body   = steps.consultar_citas_paciente.rows
  }
}