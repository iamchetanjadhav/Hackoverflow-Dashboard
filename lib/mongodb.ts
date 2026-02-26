import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

const uri = process.env.MONGODB_URI;

let _client: MongoClient | null = null;

async function createClient(): Promise<MongoClient> {
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10_000,
    connectTimeoutMS:         10_000,
    socketTimeoutMS:          45_000,
    maxPoolSize:              5,
  });
  await client.connect();

  // Clear cached client when connection drops so next request reconnects
  client.on('close',          ()    => { _client = null; });
  client.on('topologyClosed', ()    => { _client = null; });
  client.on('error',          (err) => { console.error('[mongodb] Client error:', err.message); _client = null; });

  return client;
}

// In development, preserve connection across hot reloads via global
const globalWithMongo = global as typeof globalThis & {
  _mongoClient?: MongoClient | null;
};

async function getClient(): Promise<MongoClient> {
  if (process.env.NODE_ENV === 'development') {
    if (!globalWithMongo._mongoClient) {
      globalWithMongo._mongoClient = await createClient();
    }
    return globalWithMongo._mongoClient;
  }

  if (!_client) {
    _client = await createClient();
  }
  return _client;
}

// Drop-in replacement — same interface as before (Promise<MongoClient>)
const clientPromise: Promise<MongoClient> = getClient();

export default clientPromise;

// Named export for places that need a fresh client on reconnect
export { getClient };