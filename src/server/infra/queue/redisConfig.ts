import { ConnectionOptions } from 'bullmq';
import Redis from 'ioredis';
// @ts-ignore
import RedisMock from 'ioredis-mock';

const getRedisHost = () => {
  let host = process.env.REDIS_HOST;
  if (!host || host === 'redis') {
    return '127.0.0.1';
  }
  return host.replace(/^https?:\/\//, '');
};

const useMock = !process.env.REDIS_HOST || process.env.REDIS_HOST === 'redis' || process.env.REDIS_HOST === '127.0.0.1';

export const redisConfig: any = useMock 
  ? new RedisMock({
      data: {},
    })
  : {
      host: getRedisHost(),
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null,
      tls: process.env.REDIS_HOST?.includes('upstash.io') ? {} : undefined,
    };
