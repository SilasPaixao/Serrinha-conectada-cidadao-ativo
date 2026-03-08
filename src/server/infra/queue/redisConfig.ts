import { ConnectionOptions } from 'bullmq';
import Redis from 'ioredis';
// @ts-ignore
import RedisMock from 'ioredis-mock';

const getRedisHost = () => {
  let host = process.env.REDIS_HOST;
  if (!host) {
    return '127.0.0.1';
  }
  // Remove protocol if present (ioredis expects host only)
  return host.replace(/^https?:\/\//, '');
};

// Only use mock if explicitly requested. 
// If REDIS_HOST is provided, we should ALWAYS try to use it.
const useMock = process.env.USE_REDIS_MOCK === 'true';

export const redisConfig: any = useMock 
  ? new RedisMock({
      data: {},
    })
  : {
      host: getRedisHost(),
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null,
      tls: (process.env.REDIS_HOST?.includes('upstash.io') || process.env.REDIS_TLS === 'true') ? {} : undefined,
    };
