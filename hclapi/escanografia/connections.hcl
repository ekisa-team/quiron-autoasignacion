connection "sqlserver" "main" {
  url = env("DATABASE_URL")
  
  pool {
    max_open_conns    = 50
    max_idle_conns    = 10
    conn_max_lifetime = "30m"
    idle_timeout      = "5m"
  }
}