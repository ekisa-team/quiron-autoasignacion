connection "sql" "main" {
  engine = "sqlserver"
  source = env("DATABASE_URL", "sqlserver://EkisaAzureSQL:XaDev2025*%2F@ekisadesarrollo.database.windows.net:1433?database=QUIRON2INSTITUCIONES&encrypt=true")

  pool {
    max_open = 50
    max_idle = 10
  }
}