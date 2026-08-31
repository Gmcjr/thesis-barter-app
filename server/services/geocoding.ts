interface GeoapifyResult {
  lat?: number;
  lon?: number;
  postcode?: string;
  country?: string;
  country_code?: string;
}

interface GeoapifyResponse {
  results?: GeoapifyResult[];
}

export interface GeocodedLocation {
  lat: number;
  lng: number;
  postalCode: string;
  country: string;
}

// this retrieves Geoapify API key from .envv
// if something is wrong- an error will throw instead of sending bad requests
const getApiKey = () => {
  const apiKey = process.env.GEOAPIFY_API_KEY;

  if (!apiKey) {
    throw new Error('GEOAPIFY_API_KEY is not configured');
  }

  return apiKey;
};

/* geocodePostalCode is a function for forward geocoding
*    - it recieves a postal code and a country
*    - and calculates latitude and longitude (lat and lng)
*           EX of input: geocodePostalCode('60601', 'US')
*    - then returns an object in the following format:
*           {
               lat: 41.885,
               lng: -87.622,
               postalCode: '60601',
               country: 'US'
            }
* frontend Countries.ts allows us to let the user select the fullstring of their country
* from a dropdown and then converts it to the string => so "United States" becomes "US"
*/
export const geocodePostalCode = async (
  postalCode: string,
  country: string,
): Promise<GeocodedLocation | null> => {
  const countryCode = country.trim().toUpperCase();

  const params = new URLSearchParams({
    postcode: postalCode.trim(),
    country: countryCode,
    format: 'json',
    limit: '1',
    apiKey: getApiKey(),
  });

  const response = await fetch(
    `https://api.geoapify.com/v1/geocode/search?${params.toString()}`,
  );

  if (!response.ok) {
    throw new Error(`Geoapify forward geocoding failed with status ${response.status}`);
  }

  const data = await response.json() as GeoapifyResponse;
  const result = data.results?.[0];

  if (
    !result
    || typeof result.lat !== 'number'
    || typeof result.lon !== 'number'
  ) {
    return null;
  }

  return {
    lat: result.lat,
    lng: result.lon,
    postalCode: postalCode.trim(),
    country: countryCode,
  };
};

/* reverseGeocode does the opposite of the previous function
*    - it recieves a latitude and longitude
*    - and then calculates what postal code and country those coordinates belong to
*             EX of input: reverseGeocode(41.8781, -87.6298)
*    - then returns an object in the following format:
*            {
*               lat: 41.88,
*               lng: -87.62,
*               postalCode: "60601",
*               country: "US"
*            }
*/
export const reverseGeocode = async (
  lat: number,
  lng: number,
): Promise<GeocodedLocation | null> => {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: 'json',
    limit: '1',
    apiKey: getApiKey(),
  });

  const response = await fetch(
    `https://api.geoapify.com/v1/geocode/reverse?${params.toString()}`,
  );

  if (!response.ok) {
    throw new Error(`Geoapify reverse geocoding failed with status ${response.status}`);
  }

  const data = await response.json() as GeoapifyResponse;
  const result = data.results?.[0];

  if (
    !result
    || typeof result.lat !== 'number'
    || typeof result.lon !== 'number'
    || !result.postcode
    || !result.country_code
  ) {
    return null;
  }

  return {
    lat: result.lat,
    lng: result.lon,
    postalCode: result.postcode,
    country: result.country_code.toUpperCase(),
  };
};
