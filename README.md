# TODO README


Callsigns in the last hour:

```sql
select plane_id, callsign from planespotting.radio_messages where callsign is not null and ts >= now() - interval '1 hour';
```

Latest data for planes that have a plane_id, callsign, altitude and position and updated in the last 2 minutes:

```
SELECT plane_id, callsign, (CURRENT_TIMESTAMP - latest_ts) as last_update, altitude, distance('POINT (-1.1436530095627766 52.94765937629119)', position) / 1000 as distance, position from (
select plane_id,
  (select callsign from planespotting.radio_messages where plane_id = planes.plane_id and callsign is not null order by ts desc limit 1) as callsign,
  (select altitude from planespotting.radio_messages where plane_id = planes.plane_id and altitude is not null order by ts desc limit 1) as altitude,
  (SELECT position from planespotting.radio_messages where plane_id = planes.plane_id and position is not null order by ts desc limit 1) as position,
  (SELECT ts from planespotting.radio_messages where plane_id = planes.plane_id order by ts desc limit 1) as latest_ts
from (select distinct plane_id from planespotting.radio_messages) as planes
) as interesting_planes WHERE latest_ts >= current_timestamp - '2 mins'::interval and plane_id is not null and callsign is not null and altitude is not null and position is not null order by last_update ASC;
```

TODO... work out when to call the API to get the plane data.  Periodically run the above query, check to see if we have the plane data.  If not get it, and put it in the database.  Then push the information out to the front end via MQTT?

