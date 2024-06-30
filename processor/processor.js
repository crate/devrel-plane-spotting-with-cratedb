import * as dotenv from 'dotenv';
import pg from 'pg';
import mqtt from 'mqtt';

dotenv.config();

const DEBUG_MODE = process.env.DEBUG_MODE === '1';

async function sleep() {
  return new Promise((resolve) => {
    setTimeout(resolve, process.env.SLEEP_INTERVAL * 1000);
  });
};
const crateDBClient = new pg.Client({
  connectionString: `postgresql://${process.env.CRATEDB_USER}:${process.env.CRATEDB_PASSWORD}@${process.env.CRATEDB_HOST}:${process.env.CRATEDB_PORT}/${process.env.CRATEDB_SCHEMA}`,
  ssl: process.env.CRATEDB_SSLMODE === '1'
});

await crateDBClient.connect();
console.log(`Connected as ${process.env.CRATEDB_USER} to CrateDB at ${process.env.CRATEDB_HOST}:${process.env.CRATEDB_PORT}.`);

const mqttClient = mqtt.connect(`${process.env.MQTT_PROTOCOL}://${process.env.MQTT_HOST}:${process.env.MQTT_PORT}`, {
  username: process.env.MQTT_USER,
  password: process.env.MQTT_PASSWORD
});

console.log(`Connected as ${process.env.MQTT_USER} to MQTT broker at ${process.env.MQTT_HOST}:${process.env.MQTT_PORT}.`);

const latestPlaneQuery = {
  name: 'latest-plane',
  text: `SELECT plane_id, callsign, (CURRENT_TIMESTAMP - latest_ts) AS last_update, altitude, distance('POINT (${process.env.USER_LONGITUDE} ${process.env.USER_LATITUDE})', position) / 1000 AS distance, position FROM (
  SELECT plane_id,
    (SELECT callsign FROM planespotting.radio_messages WHERE plane_id = planes.plane_id AND callsign IS NOT NULL ORDER BY ts DESC LIMIT 1) AS callsign,
    (SELECT altitude FROM planespotting.radio_messages WHERE plane_id = planes.plane_id AND altitude IS NOT NULL ORDER BY ts DESC LIMIT 1) AS altitude,
    (SELECT position FROM planespotting.radio_messages WHERE plane_id = planes.plane_id AND position IS NOT NULL ORDER BY ts DESC LIMIT 1) AS position,
    (SELECT ts FROM planespotting.radio_messages WHERE plane_id = planes.plane_id ORDER BY ts DESC LIMIT 1) AS latest_ts
  FROM (SELECT distinct plane_id from planespotting.radio_messages) AS planes
  ) AS interesting_planes WHERE latest_ts >= CURRENT_TIMESTAMP - '2 mins'::interval AND plane_id IS NOT NULL AND callsign IS NOT NULL AND altitude IS NOT NULL AND position IS NOT NULL
  ORDER BY last_update ASC LIMIT 1`
};

while (true) {
  const res = await crateDBClient.query(latestPlaneQuery);
  let flight;

  if (res.rowCount === 1) {
    const callsign = res.rows[0].callsign.trim();
    console.log(`Checking for callsign ${callsign}.`);

    const getFlightDetailsQuery = {
      name: 'get-flight-details',
      text: `SELECT flightinfo FROM planespotting.flights WHERE callsign=$1 AND day=date_trunc('day', CURRENT_TIMESTAMP)`,
      values: [ callsign ]
    };

    const flightDetailsRes = await crateDBClient.query(getFlightDetailsQuery);

    if (flightDetailsRes.rowCount === 0) {
      // We haven't seen this flight before, get details from FlightAware.
      const flightAwareAPIURL = `https://aeroapi.flightaware.com/aeroapi/flights/${callsign}?max_pages=1`;

      const flightAwareResponse = await fetch(flightAwareAPIURL, {
        headers: {
          'x-apikey': process.env.FLIGHTAWARE_API_KEY,
          'Accept': 'application/json'
        }
      });

      if (flightAwareResponse.status === 200) {
        const flightData = await flightAwareResponse.json();

        if (flightData.flights) {
          for (flight of flightData.flights) {
            // The response contains an array of recent past, current and
            // planned future flights with this ID.  The one we want is
            // currently in progress, so progress_percent between 1 and 99.
            if (flight.progress_percent > 0 && flight.progress_percent < 100) {
              if (DEBUG_MODE) { console.log(`Storing details for ${callsign} in CrateDB.`); }

              // Store the flight details in CrateDB.
              const flightInsertQuery = {
                text: `INSERT INTO planespotting.flights (callsign, flightinfo) VALUES ($1, $2)`,
                values: [ callsign, flight ]
              };

              const flightInsertRes = await crateDBClient.query(flightInsertQuery);
              if (flightInsertRes.rowCount === 1 && DEBUG_MODE) {
                console.log('Stored flight details in CrateDB.');
              }

              // Don't look for other flights in the array of recent flights as we found it.
              break;
            }
          }
        }
      } else {
        if (DEBUG_MODE) { console.log(`Error: FlightAware API returned ${flightAwareResponse.status} code.`); }
      }
    } else {
      if (DEBUG_MODE) { console.log('Found flight in CrateDB.'); }
      flight = flightDetailsRes.rows[0].flightinfo;
    }

    // We found a flight, but is it interesting / alert worthy?
    const isInterestingQuery = {
      name: 'is-interesting',
      text: 'SELECT description FROM planespotting.interesting_aircraft_types WHERE aircraft_type=$1',
      values: [ flight.aircraft_type ]
    };

    if (DEBUG_MODE) { console.log(`Trying to determine if ${flight.aircraft_type} is interesting...`); }

    const isInterestingRes = await crateDBClient.query(isInterestingQuery);
    
    if (isInterestingRes.rowCount === 1) {
      // This flight is alert worthy.
      const displayDetails = {
        flightNumber: flight.ident_iata || '',
        registration: flight.registration || '',
        aircraftType: isInterestingRes.rows[0].description,
        origin: flight?.origin?.code_iata || '',
        destination: flight?.destination?.code_iata || '',
        altitude: res.rows[0].altitude
      };

      // Publish the alert to the MQTT broker.
      const mqttResponse = mqttClient.publish(process.env.MQTT_CHANNEL, JSON.stringify(displayDetails));
      if (DEBUG_MODE) { console.log(`Published message to ${process.env.MQTT_CHANNEL} MQTT channel.`); }

      console.log(`Flight with callsign ${callsign} has triggered an alert.`);
      console.log(displayDetails);
    } else {
      console.log(`Flight with callsign ${callsign} does not trigger an alert.`);
    }
  } else {
    console.log('Nothing to do.');
  }

  // Wait a bit before looking again.
  if (DEBUG_MODE) { console.log('Sleeping.'); }
  await sleep();
}