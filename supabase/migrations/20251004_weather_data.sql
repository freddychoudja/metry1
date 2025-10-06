-- Create weather_data table for local weather storage
create table if not exists weather_data (
  id serial primary key,
  latitude numeric not null,
  longitude numeric not null,
  date date not null,
  temperature numeric not null,
  precipitation numeric not null,
  wind_speed numeric not null,
  humidity numeric not null,
  created_at timestamptz default now(),
  
  -- Unique constraint for coordinates and date
  unique(latitude, longitude, date)
);

-- Simple index for location-based queries
create index if not exists weather_data_location_idx 
on weather_data (latitude, longitude);

-- Index for date queries
create index if not exists weather_data_date_idx 
on weather_data (date);

-- Function to find nearest weather data using simple distance calculation
create or replace function get_nearest_weather(
  lat numeric,
  lon numeric,
  target_date date
) returns table (
  id int,
  distance numeric,
  temperature numeric,
  precipitation numeric,
  wind_speed numeric,
  humidity numeric
) language sql stable as $$
  select
    id,
    sqrt(power(latitude - $1, 2) + power(longitude - $2, 2)) as distance,
    temperature,
    precipitation,
    wind_speed,
    humidity
  from weather_data
  where date = $3
  order by sqrt(power(latitude - $1, 2) + power(longitude - $2, 2))
  limit 1;
$$;