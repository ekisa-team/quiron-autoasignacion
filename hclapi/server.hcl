server {
  host          = "0.0.0.0"
  port          = 8080
  read_timeout  = "30s"
  write_timeout = "60s"
  max_body_size = "10MB"
}

telemetry {
  service_name = "quiron-autoasignacion"
  log_level    = "debug"
  log_format   = "json"
}