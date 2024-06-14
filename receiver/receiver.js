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
    plane_id: msg.hex_ident
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
    msgData.callsign = parseInt(msg.callsign.trim(), 10);
    if (isNaN(msgData.callsign)) { 
      delete msgData.callsign;
    };
  }

  if (msg.squawk) {
    msgData.squawk = parseInt(msg.squawk.trim(), 10);
  }

  if (Object.keys(msgData).length > 1) {
    console.log(msgData);
  }
});