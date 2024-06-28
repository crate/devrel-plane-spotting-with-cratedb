CREATE USER planespotter WITH (password='iseeu123');

GRANT ALL PRIVILEGES ON SCHEMA planespotting TO planespotter;

CREATE TABLE IF NOT EXISTS planespotting.radio_messages (
  plane_id STRING,
  callsign STRING,
  altitude INTEGER,
  squawk INTEGER,
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION,
  position GEO_POINT,
  ts TIMESTAMP WITH TIME ZONE GENERATED ALWAYS AS CURRENT_TIMESTAMP,
  day GENERATED ALWAYS AS date_trunc('day', CURRENT_TIMESTAMP)
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
  flight_number STRING,
  day GENERATED ALWAYS AS date_trunc('day', CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS planespotting.interesting_aircraft_types (
  aircraft_type STRING PRIMARY KEY,
  description STRING
);

INSERT INTO planespotting.interesting_aircraft_types (aircraft_type, description) values
(
  'A400', 'A400M Atlas'
),
(
  'A388', 'A380-800'
),
(
  'A35K', 'A350-1000'
),
(
  'A359', 'A350-900'
),
(
  'A342', 'A340-200'
),
(
  'A343', 'A340-300'
),
(
  'A345', 'A340-500'
),
(
  'A346', 'A340-600'
),
(
  'A332', 'A330-200'
),
(
  'A333', 'A330-300'
),
(
  'A337', 'A330-700 Beluga XL'
),
(
  'A338', 'A330-800'
),
(
  'A3ST', 'A300ST Beluga'
),
(
  'A20N', 'A320neo'
),
(
  'A19N', 'A319neo'
),
(
  'A310', 'A310'
),
(
  'A30B', 'A300B-200'
),
(
  'A306', 'A300B-600'
),
(
  'A124', 'AN-124 Ruslan'
),
(
  'A225', 'AN-225 Mriya'
),
(
  'B37M', '737 MAX 7'
),
(
  'B38M', '737 MAX 8'
),
(
  'B39M', '737 MAX 9'
),
(
  'B3XM', '737 MAX 10'
),
(
  'B743', '747-300'
),
(
  'B744', '747-400'
),
(
  'B748', '747-800'
),
(
  'B74S', '747SP'
),
(
  'B752', '757-200'
),
(
  'B753', '757-300'
),
(
  'B762', '767-200'
),
(
  'B763', '767-300'
),
(
  'B764', '767-400'
),
(
  'B772', '777-200'
),
(
  'B773', '777-300'
),
(
  'B778', '777-8'
),
(
  'B779', '777-9'
),
(
  'B77L', '777-200LR'
),
(
  'B77W', '777-300ER'
),
(
  'B788', '787-8'
),
(
  'B789', '787-9'
),
(
  'B78X', '787-10'
),
(
  'BLCF', '747-400 Dreamlifter'
),
(
  'C17', 'C-17 Globemaster'
),
(
  'DC10', 'MD-10'
),
(
  'MD11', 'MD-11'
),
(
  'E190', 'E190'
),
(
  'E195', 'E195'
),
(
  'E275', 'E175-E2'
),
(
  'E290', 'E190-E2'
),
(
  'E295', 'E195-E2'
),
(
  'IL-96', 'IL-96'
);