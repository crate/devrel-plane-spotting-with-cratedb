CREATE USER planespotter WITH (password='iseeu123');

GRANT ALL PRIVILEGES ON SCHEMA planespotting TO planespotter;

CREATE TABLE IF NOT EXISTS planespotting.flight_updates (
  plane_id STRING,
  callsign STRING,
  altitude INTEGER,
  squawk INTEGER,
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION,
  position GEO_POINT,
  last_modified TIMESTAMP WITH TIME ZONE GENERATED ALWAYS AS CURRENT_TIMESTAMP
);