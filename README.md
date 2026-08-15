# Effortum

Time tracker that stores data only in Local Storage.

## Docker

This app uses TanStack Start with Nitro and can be run as a Docker container. Find the Docker image to use at [https://hub.docker.com/r/darignac/effortum](https://hub.docker.com/r/darignac/effortum). The service is running on port `9092`.

### Build image manually

```sh
docker build -t effortum:latest .
```

### Run container

```sh
docker run --name effortum --restart unless-stopped -p 9092:9092 effortum:latest
```

The container listens on `0.0.0.0:9092`.

### Caddy upstream

Point your existing Caddy reverse proxy upstream to:

- `127.0.0.1:9092` (if Caddy runs on the same host)
- or the container network address/port `9092` (if using a custom Docker network)
