export function getRedisConnection() {
  const host = process.env.REDIS_HOST;
  const port = +process.env.REDIS_PORT!;
  const password = process.env.REDIS_PASSWORD;

  return {
    host,
    port,
    password,
  };
}
