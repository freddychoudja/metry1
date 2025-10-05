-- Création de la table pour stocker les données météo locales
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
  
  -- Index pour recherche rapide par coordonnées et date
  unique(latitude, longitude, date)
);

-- Index pour optimiser les recherches géographiques
create index if not exists weather_data_location_idx 
on weather_data using gist (
  ll_to_earth(latitude, longitude)
);

-- Fonction pour trouver les données météo les plus proches
create or replace function get_nearest_weather(
  lat numeric,
  lon numeric,
  target_date date
) returns table (
  id int,
  distance float,
  temperature numeric,
  precipitation numeric,
  wind_speed numeric,
  humidity numeric
) language sql stable as $$
  select
    id,
    earth_distance(
      ll_to_earth(latitude, longitude),
      ll_to_earth($1, $2)
    ) as distance,
    temperature,
    precipitation,
    wind_speed,
    humidity
  from weather_data
  where date = $3
  order by ll_to_earth(latitude, longitude) <-> ll_to_earth($1, $2)
  limit 1;
$$;