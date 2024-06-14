import * as dotenv from 'dotenv';
import * as sbs1 from 'sbs1';
// TODO - Postgres or Crate...

dotenv.config();

const DEBUG_MODE = process.env.DEBUG_MODE === '1';
const SBS_HOST = process.env.SBS_HOST || '127.0.0.1';
const SBS_PORT = process.env.SBS_PORT || 30003;

const sbs1Client = sbs1.createClient({
  host: SBS_HOST,
  port: SBS_PORT
});

sbs1Client.on('message', async(msg) => {
  if (DEBUG_MODE) { console.log(msg); }

  const msgData = {
    hex_ident: msg.hex_ident,
    last_updated: Date.now()
  };

  if (msg.lat && msg.lon) {
    msgData.lat = msg.lat;
    msgData.lon = msg.lon;
    msgData.position = `POINT (${msg.lon} ${msg.lat})`;
  }

  if (msg.altitude) {
    msgData.altitude = msg.altitude;
  }

  if (msg.callsign) {
    msgData.callsign = msg.callsign.trim();
  }

  if (msg.squawk) {
    msgData.squawk = msg.squawk.trim();
  }

  if (Object.keys(msgData).length > 2) {
    console.log(msgData);
  }
});