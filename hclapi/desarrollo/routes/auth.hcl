schema "login_request" {
  field "identificacion" {
    type     = string
    required = true
  }

  field "codigo_tipo_documento" {
    type     = string
    required = true
  }

  field "id_cliente" {
    type     = int
    required = true
  }
}

schema "change_password_request" {
  field "patient_id" {
    type     = int
    required = true
  }

  field "client_id" {
    type     = int
    required = true
  }

  field "new_password_hash" {
    type       = string
    required   = true
    min_length = 6
  }
}

schema "solicitar_recuperacion_request" {
  field "document_type" {
    type     = string
    required = true
  }

  field "identification" {
    type     = string
    required = true
  }

  field "email" {
    type     = string
    required = true
  }

  field "reset_token" {
    type     = string
    required = true
  }

  field "client_id" {
    type     = int
    required = true
  }
}

schema "restablecer_clave_token_request" {
  field "token" {
    type     = string
    required = true
  }

  field "new_password_hash" {
    type     = string
    required = true
  }

  field "client_id" {
    type     = int
    required = true
  }
}

schema "verificar_email_request" {
  field "token" {
    type     = string
    required = true
  }

  field "client_id" {
    type     = int
    required = true
  }
}

schema "login_fallido_request" {
  field "usuario_id" {
    type     = int
    required = true
  }
}

schema "login_exitoso_request" {
  field "usuario_id" {
    type     = int
    required = true
  }
}

endpoint "POST /api/v1/auth/login" {
  description = "Valida credenciales e informacion del paciente para login."

  request {
    body = schema.login_request
  }

  pipeline {
    sql "consultar_paciente" {
      connection = connection.sqlserver.main
      query      = "EXEC dbo.Proc_Aut_ConsultarPacienteLogin @Identificacion, @CodigoTipoDocumento, @IdCliente"
      args = {
        Identificacion      = ctx.request.body.identificacion
        CodigoTipoDocumento = ctx.request.body.codigo_tipo_documento
        IdCliente           = ctx.request.body.id_cliente
      }
    }

    respond {
      condition = steps.consultar_paciente.rows_affected == 0
      status    = 404
      body      = problem(404, "Paciente no encontrado o credenciales no registradas")
    }

    respond {
      status = 200
      body   = steps.consultar_paciente.row
    }
  }
}

endpoint "POST /api/v1/auth/cambiar-clave" {
  description = "Actualiza contrasena en sesion activa."

  request {
    body = schema.change_password_request
  }

  pipeline {
    sql "cambiar_clave" {
      connection = connection.sqlserver.main
      query      = "EXEC dbo.Proc_Aut_CambiarClaveSesion @PatientId, @ClientId, @NewPasswordHash"
      args = {
        PatientId       = ctx.request.body.patient_id
        ClientId        = ctx.request.body.client_id
        NewPasswordHash = ctx.request.body.new_password_hash
      }
    }

    respond {
      status = 200
      body = {
        status  = "success"
        message = "Contrasena actualizada exitosamente"
      }
    }
  }
}

endpoint "POST /api/v1/auth/solicitar-recuperacion" {
  description = "Asigna token de recuperacion temporal."

  request {
    body = schema.solicitar_recuperacion_request
  }

  pipeline {
    sql "solicitar_token" {
      connection = connection.sqlserver.main
      query      = "EXEC dbo.Proc_Aut_SolicitarRecuperacionClave @Doc, @DocType, @Email, @Token, @ClientId"
      args = {
        Doc      = ctx.request.body.identification
        DocType  = ctx.request.body.document_type
        Email    = ctx.request.body.email
        Token    = ctx.request.body.reset_token
        ClientId = ctx.request.body.client_id
      }
    }

    respond {
      condition = steps.solicitar_token.rows_affected == 0
      status    = 404
      body      = problem(404, "Paciente no encontrado o los datos no coinciden.")
    }

    respond {
      status = 200
      body = {
        status         = "success"
        email          = steps.solicitar_token.row.CorreoPaciente
        identification = steps.solicitar_token.row.IdentificacionPaciente
      }
    }
  }
}

endpoint "POST /api/v1/auth/restablecer-clave" {
  description = "Restablece contrasena con token."

  request {
    body = schema.restablecer_clave_token_request
  }

  pipeline {
    sql "restablecer" {
      connection = connection.sqlserver.main
      query      = "EXEC dbo.Proc_Aut_RestablecerClaveToken @Token, @NewPasswordHash, @ClientId"
      args = {
        Token           = ctx.request.body.token
        NewPasswordHash = ctx.request.body.new_password_hash
        ClientId        = ctx.request.body.client_id
      }
    }

    respond {
      condition = steps.restablecer.rows_affected == 0
      status    = 400
      body      = problem(400, "Token invalido o expirado")
    }

    respond {
      status = 200
      body = {
        status  = "success"
        message = "Contrasena restablecida con exito"
        email   = steps.restablecer.row.CorreoPaciente
      }
    }
  }
}

endpoint "POST /api/v1/auth/verificar-email" {
  description = "Verifica email mediante token."

  request {
    body = schema.verificar_email_request
  }

  pipeline {
    sql "verificar_token" {
      connection = connection.sqlserver.main
      query      = "EXEC dbo.Proc_Aut_VerificarEmailToken @Token, @ClientId"
      args = {
        Token    = ctx.request.body.token
        ClientId = ctx.request.body.client_id
      }
    }

    respond {
      condition = steps.verificar_token.row.FilasAfectadas == 0
      status    = 400
      body      = problem(400, "Token invalido o expirado")
    }

    respond {
      status = 200
      body = {
        status  = "success"
        message = "Correo verificado exitosamente"
      }
    }
  }
}

endpoint "GET /api/v1/auth/validar-token-recuperacion" {
  description = "Valida vigencia de token."

  request {
    query {
      field "token" {
        type     = string
        required = true
      }
      field "identificacion" {
        type     = string
        required = true
      }
      field "id_cliente" {
        type     = int
        required = true
      }
    }
  }

  pipeline {
    sql "comprobar_token" {
      connection = connection.sqlserver.main
      query      = "EXEC dbo.Proc_Aut_ValidarTokenRecuperacion @Token, @Doc, @ClientId"
      args = {
        Token    = ctx.request.query.token
        Doc      = ctx.request.query.identificacion
        ClientId = ctx.request.query.id_cliente
      }
    }

    respond {
      status = 200
      body = {
        valid = steps.comprobar_token.rows_affected > 0
      }
    }
  }
}

endpoint "POST /api/v1/auth/intento-fallido" {
  description = "Incrementa los intentos fallidos de login atómicamente y bloquea la cuenta si llega a 5."

  request {
    body = schema.login_fallido_request
  }

  pipeline {
    sql "registrar_intento" {
      connection = connection.sqlserver.main
      query      = "EXEC dbo.Proc_Aut_RegistrarIntentoFallido @Id"
      args = {
        Id = ctx.request.body.usuario_id
      }
    }

    respond {
      status = 200
      body   = steps.registrar_intento.row
    }
  }
}

endpoint "POST /api/v1/auth/login-exitoso" {
  description = "Resetea intentos fallidos y actualiza la fecha tras login exitoso."

  request {
    body = schema.login_exitoso_request
  }

  pipeline {
    sql "registrar_exito" {
      connection = connection.sqlserver.main
      query      = "EXEC dbo.Proc_Aut_RegistrarLoginExitoso @Id"
      args = {
        Id = ctx.request.body.usuario_id
      }
    }

    respond {
      status = 200
      body = {
        success = true
      }
    }
  }
}