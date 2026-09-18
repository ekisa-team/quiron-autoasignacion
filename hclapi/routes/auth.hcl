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
    type     = integer
    required = true
  }
}

schema "change_password_request" {
  field "patient_id" {
    type     = integer
    required = true
  }
  field "client_id" {
    type     = integer
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
    format   = "email"
    required = true
  }
  field "reset_token" {
    type     = string
    required = true
  }
  field "client_id" {
    type     = integer
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
    type     = integer
    required = true
  }
}

schema "verificar_email_request" {
  field "token" {
    type     = string
    required = true
  }
  field "client_id" {
    type     = integer
    required = true
  }
}

schema "login_fallido_request" {
  field "usuario_id" {
    type     = integer
    required = true
  }
}

schema "login_exitoso_request" {
  field "usuario_id" {
    type     = integer
    required = true
  }
}

route "POST /api/v1/auth/login" {
  summary = "Valida credenciales e informacion del paciente para login"
  tag     = "auth"

  request {
    body = login_request
  }

  sql "consultar_paciente" {
    connection = "main"
    query      = "EXEC dbo.Proc_Aut_ConsultarPacienteLogin @Identificacion, @CodigoTipoDocumento, @IdCliente"
    args = {
      Identificacion      = ctx.request.body.identificacion
      CodigoTipoDocumento = ctx.request.body.codigo_tipo_documento
      IdCliente           = ctx.request.body.id_cliente
    }
  }

  respond {
    when   = steps.consultar_paciente.rows_affected == 0
    status = 404
    body   = problem(404, "Paciente no encontrado o credenciales no registradas")
  }

  respond {
    status = 200
    body   = steps.consultar_paciente.row
  }
}

route "POST /api/v1/auth/cambiar-clave" {
  summary = "Actualiza contrasena en sesion activa"
  tag     = "auth"

  request {
    body = change_password_request
  }

  sql "cambiar_clave" {
    connection = "main"
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

route "POST /api/v1/auth/solicitar-recuperacion" {
  summary = "Asigna token de recuperacion temporal"
  tag     = "auth"

  request {
    body = solicitar_recuperacion_request
  }

  sql "solicitar_token" {
    connection = "main"
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
    when   = steps.solicitar_token.rows_affected == 0
    status = 404
    body   = problem(404, "Paciente no encontrado o los datos no coinciden.")
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

route "POST /api/v1/auth/restablecer-clave" {
  summary = "Restablece contrasena con token"
  tag     = "auth"

  request {
    body = restablecer_clave_token_request
  }

  sql "restablecer" {
    connection = "main"
    query      = "EXEC dbo.Proc_Aut_RestablecerClaveToken @Token, @NewPasswordHash, @ClientId"
    args = {
      Token           = ctx.request.body.token
      NewPasswordHash = ctx.request.body.new_password_hash
      ClientId        = ctx.request.body.client_id
    }
  }

  respond {
    when   = steps.restablecer.rows_affected == 0
    status = 400
    body   = problem(400, "Token invalido o expirado")
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

route "POST /api/v1/auth/verificar-email" {
  summary = "Verifica email mediante token"
  tag     = "auth"

  request {
    body = verificar_email_request
  }

  sql "verificar_token" {
    connection = "main"
    query      = "EXEC dbo.Proc_Aut_VerificarEmailToken @Token, @ClientId"
    args = {
      Token    = ctx.request.body.token
      ClientId = ctx.request.body.client_id
    }
  }

  respond {
    when   = steps.verificar_token.row.FilasAfectadas == 0
    status = 400
    body   = problem(400, "Token invalido o expirado")
  }

  respond {
    status = 200
    body = {
      status  = "success"
      message = "Correo verificado exitosamente"
    }
  }
}

route "GET /api/v1/auth/validar-token-recuperacion" {
  summary = "Valida vigencia de token"
  tag     = "auth"

  request {
    query "token" {
      type     = string
      required = true
    }
    query "identificacion" {
      type     = string
      required = true
    }
    query "id_cliente" {
      type     = integer
      required = true
    }
  }

  sql "comprobar_token" {
    connection = "main"
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

route "POST /api/v1/auth/intento-fallido" {
  summary = "Incrementa los intentos fallidos de login atómicamente y bloquea la cuenta si llega a 5"
  tag     = "auth"

  request {
    body = login_fallido_request
  }

  sql "registrar_intento" {
    connection = "main"
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

route "POST /api/v1/auth/login-exitoso" {
  summary = "Resetea intentos fallidos y actualiza la fecha tras login exitoso"
  tag     = "auth"

  request {
    body = login_exitoso_request
  }

  sql "registrar_exito" {
    connection = "main"
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