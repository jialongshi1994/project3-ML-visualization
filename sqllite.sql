CREATE TABLE data(
     id INTEGER primary key autoincrement not null ,
     country  TEXT default null,
     Lat  TEXT default null,
     Lon  TEXT default null,
     country_code  TEXT default null,
     province  TEXT default null,
     city  TEXT default null,
     city_code  TEXT default null,
     cases  TEXT default null,
     stat_date  DATE default null,
     active  int default null,
     Recovered  int default null,
     Deaths  int default null,
     Confirmed  int default null
)