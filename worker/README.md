# Running the lc-worker Container

To run the `lc-worker` container with systemd and required privileges, execute the following command:

```bash
docker build -t lc_engine -f scripts/Dockerfile .

docker run --network=lc- network -d --name lc-engine --privileged --tmpfs /tmp --tmpfs /run --tmpfs /run/lock -v /sys/fs/cgroup:/sys/fs/cgroup:rw --cgroupns=host lc-engine

docker exec -it lc-engine /bin/bash /usr/local/bin/startup-isolate-service.sh

docker exec -it lc-engine /bin/bash
```

# Running Redis containers
```
docker run --network=lc_network --name central_redis -d -p 6379:6379 redis

docker run --network=lc_network --name local_redis -d -p 6380:6379 redis
```