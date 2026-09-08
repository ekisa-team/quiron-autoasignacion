connection "sqlserver" "main" {
  source = env("DATABASE_URL")

  pool {
    max_open     = 50
    max_idle     = 10
    max_lifetime = "30m"
    idle_timeout = "5m"
  }
}