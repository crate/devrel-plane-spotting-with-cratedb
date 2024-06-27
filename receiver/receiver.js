import * as dotenv from 'dotenv';
import * as sbs1 from 'sbs1';
import pg from 'pg';
import squel from 'squel';

dotenv.config();

const DEBUG_MODE = process.env.DEBUG_MODE === '1';

const sbs1Client = sbs1.createClient({
  host: process.env.SBS_HOST,
  port: process.env.SBS_PORT
});

const crateDBClient = new pg.Client({
  connectionString: `postgresql://${process.env.CRATEDB_USER}:${process.env.CRATEDB_PASSWORD}@${process.env.CRATEDB_HOST}:${process.env.CRATEDB_PORT}/${process.env.CRATEDB_SCHEMA}`
});

await crateDBClient.connect();
console.log(`Connected as ${process.env.CRATEDB_USER} to CrateDB at ${process.env.CRATEDB_HOST}:${process.env.CRATEDB_PORT}.`);

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
    msgData.altitude = parseInt(msg.altitude, 10);
  }

  if (msg.callsign) {
    msgData.callsign = msg.callsign.trim();
  }

  if (msg.squawk) {
    msgData.squawk = parseInt(msg.squawk.trim(), 10);
  }

  if (Object.keys(msgData).length > 1) {
    console.log(msgData);

    const messageSql = squel.insert()
      .into('radio_messages')
      .setFields(msgData)
      .toString();

    if (DEBUG_MODE) { console.log(messageSql); }

    const result = await crateDBClient.query(messageSql);
    
    if (DEBUG_MODE && result.rowCount === 1) {
      console.log('Written to CrateDB.');
    }
  }
});