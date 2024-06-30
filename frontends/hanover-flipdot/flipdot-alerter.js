import FlipDot from 'flipdot-display';
import * as dotenv from 'dotenv';
import mqtt from 'mqtt';
import { Mutex} from 'async-mutex';

dotenv.config();

const DEBUG_MODE = process.env.DEBUG_MODE === '1';

async function sleep(millis) {
  return new Promise((resolve) => {
    setTimeout(resolve, millis);
  });
}
function calculatePixelWidth(msg) {
  let pixelCount = 0;

  for (const char of msg) {
    // Regular chars 9 pixels wide, a space is 1.
    pixelCount += (char === ' ' ? 1 : 9);
  }

  return pixelCount;
}

const flippy = new FlipDot(
  process.env.SIGN_DEVICE, 
  parseInt(process.env.SIGN_ADDRESS, 10), 
  parseInt(process.env.SIGN_ROWS, 10), 
  parseInt(process.env.SIGN_COLS, 10)
);

const mqttClient = mqtt.connect(`${process.env.MQTT_PROTOCOL}://${process.env.MQTT_HOST}:${process.env.MQTT_PORT}`, {
  username: process.env.MQTT_USER,
  password: process.env.MQTT_PASSWORD
});

console.log(`Connected as ${process.env.MQTT_USER} to MQTT broker at ${process.env.MQTT_HOST}:${process.env.MQTT_PORT}.`);

// The sign takes a long time to update, so let's use a Mutex in case subsequent
// flight details arrive while we are showing one...
// https://www.npmjs.com/package/async-mutex
const signMutex = new Mutex();

async function displayData(lines) {
  await signMutex.runExclusive(async () => {
    for (let n = 0; n < SIGN_REPEATS; n++) {
      for (const line of lines) {
        const xOffset = Math.floor((SIGN_COLS - calculatePixelWidth(line)) / 2);
        flippy.writeText(line, { font: 'Banner3' }, [0, xOffset], false, true);
        flippy.send();
        await sleep(parseInt(process.env.SIGN_FLIP_INTERVAL, 10));
      }

      flippy.fill(0xFF);
      if (n < parseInt(process.env.SIGN_REPEATS, 10)) {
        await sleep(parseInt(process.env.SIGN_FLIP_INTERVAL, 10));
      }
    }
  });
}

flippy.on('error', (err) => {
  console.error('Flippy Error:');
  console.error(err);
});

flippy.once('open', () => {
  console.log(`Connected to flip dot device at ${SIGN_DEVICE}.`);
  flippy.fill(0xFF);
});

mqttClient.on('message', async (topic, message) => {
  const flightDetails = JSON.parse(message.toString());
  console.log(flightDetails);

  const dataToDisplay = [
    flightDetails.flightNumber,
    `${flightDetails.origin} - ${flightDetails.destination}`,
    flightDetails.aircraftType,
    flightDetails.registration,
    `${flightDetails.altitude}FT`
  ];

  await displayData(dataToDisplay);
});

mqttClient.subscribe(process.env.MQTT_TOPIC);
