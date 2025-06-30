const redis = require('redis');
const { redis: redisConfig } = require('./envConfig');

const client = redis.createClient({
    socket: {
        host: redisConfig.host,
        port: redisConfig.port,
    },
    password: redisConfig.password,
});

client.on('error', (err) => {
    console.error('Redis Client Error:', err);
});

client.connect().then(() => {
    console.log('Connected to Redis');
});

module.exports = client;