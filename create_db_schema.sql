CREATE USER planespotter WITH (password='iseeu123');

GRANT ALL PRIVILEGES ON SCHEMA planespotting TO planespotter;

# Sort out partitioning by day?
CREATE TABLE IF NOT EXISTS planespotting.radio_messages (
  plane_id STRING,
  callsign STRING,
  altitude INTEGER,
  squawk INTEGER,
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION,
  position GEO_POINT,
  ts TIMESTAMP WITH TIME ZONE GENERATED ALWAYS AS CURRENT_TIMESTAMP
);

# Consider moving this to an object and storing the API response.
CREATE TABLE IF NOT EXISTS planespotting.flights (
  plane_id STRING PRIMARY KEY,
  callsign STRING,
  registration STRING,
  origin_iata STRING,
  origin_name STRING,
  destination_iata STRING,
  destination_name STRING,
  aircraft_type STRING,
  operator_iata STRING,
  flight_number STRING
);