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
    type     = string
    default  = ""
  }

  field "first_last_name" {
    type     = string
    required = true
  }

  field "second_last_name" {
    type     = string
    default  = ""
  }

  field "birth_date" {
    type     = string
    required = true
  }

  field "gender" {
    type     = string
    default  = "M"
  }

  field "address" {
    type     = string
    default  = ""
  }

  field "phone" {
    type     = string
    default  = ""
  }

  field "mobile" {
    type     = string
    required = true
  }

  field "email" {
    type     = string
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
    type     = int
    required = true
  }
}

endpoint "POST /api/v1/pacientes/registro" {
  description = "Registra paciente y usuario mediante Stored Procedure."

  request {
    body = schema.registro_paciente_request
  }

  pipeline {
    sql "registrar" {
      connection = connection.sqlserver.main
      query      = "EXEC dbo.Proc_Aut_RegistrarPacienteWeb @Identificacion, @CodigoTipoDocumento, @Nombre1, @Nombre2, @Apellido1, @Apellido2, @FechaNacimiento, @Sexo, @Direccion, @Telefono, @Celular, @Email, @PasswordHash, @VerificationToken, @IdCliente"
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
}

endpoint "GET /api/v1/pacientes/{codigo_paciente}/citas" {
  description = "Consulta el historial de citas de un paciente."

  request {
    path {
      field "codigo_paciente" {
        type     = int
        required = true
      }
    }
    query {
      field "id_cliente" {
        type     = int
        required = true
      }
    }
  }

  pipeline {
    sql "consultar_citas_paciente" {
      connection = connection.sqlserver.main
      query      = "EXEC dbo.Proc_Aut_ConsultarCitasPaciente @CodigoPaciente, @IdCliente"
      args = {
        CodigoPaciente = ctx.request.path.codigo_paciente
        IdCliente      = ctx.request.query.id_cliente
      }
    }

    respond {
      status = 200
      body   = steps.consultar_citas_paciente.rows
    }
  }
}