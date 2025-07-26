import { MongoClient, MongoClientOptions } from 'mongodb'
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const uri: string | undefined = process.env.MONGODB_URI
const options: MongoClientOptions = {}
if (!uri) {
  throw new Error('⚠️ Please define the MONGODB_URI environment variable in .env.local')
}

// Global type for Node.js to allow caching in development
declare global {
   
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options)
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

export default clientPromise
