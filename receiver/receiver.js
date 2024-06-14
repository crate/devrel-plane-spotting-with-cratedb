import * as dotenv from 'dotenv';
import * as sbs1 from 'sbs1';
// TODO - Postgres or Crate...

dotenv.config();

const SBS_HOST = process.env.SBS_HOST || '127.0.0.1';
const SBS_PORT = process.env.SBS_PORT || 30003;

const sbs1Client = sbs1.createClient({
  host: SBS_HOST,
  port: SBS_PORT
});

sbs1Client.on('message', async(msg) => {
  console.log(msg);
});