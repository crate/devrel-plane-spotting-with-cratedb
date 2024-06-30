import * as dotenv from 'dotenv';
import mqtt from 'mqtt';

dotenv.config();

const DEBUG_MODE = process.env.DEBUG_MODE === '1';

const mqttClient = mqtt.connect(`${process.env.MQTT_PROTOCOL}://${process.env.MQTT_HOST}:${process.env.MQTT_PORT}`, {
  username: process.env.MQTT_USER,
  password: process.env.MQTT_PASSWORD
});

console.log(`Connected as ${process.env.MQTT_USER} to MQTT broker at ${process.env.MQTT_HOST}:${process.env.MQTT_PORT}.`);

mqttClient.subscribe(process.env.MQTT_TOPIC);
mqttClient.on('message', (topic, message) => {
  const flightDetails = JSON.parse(message.toString());
  console.log(flightDetails);
});