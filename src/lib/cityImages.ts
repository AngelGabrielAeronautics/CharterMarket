import { Airport } from '@/types/airport';

const UNSPLASH_ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;
const DEFAULT_FALLBACK_IMAGE_URL =
  'https://images.unsplash.com/photo-1559670176-afe7c85994ba?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=800'; // A generic airport/travel image

// This function gets a city image from the Unsplash API based on the city name
export const getCityImageUrl = async (city: string, country: string): Promise<string> => {
  if (!UNSPLASH_ACCESS_KEY) {
    console.warn('Unsplash Access Key is not configured. Returning default fallback image.');
    return DEFAULT_FALLBACK_IMAGE_URL;
  }

  const query = encodeURIComponent(`${city} ${country} cityscape`);
  const url = `https://api.unsplash.com/search/photos?query=${query}&per_page=1&orientation=landscape`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        'Accept-Version': 'v1',
      },
    });

    if (!response.ok) {
      console.error(`Unsplash API error: ${response.status} ${response.statusText}`);
      const errorData = await response.json();
      console.error('Unsplash error details:', errorData);
      return DEFAULT_FALLBACK_IMAGE_URL; // Fallback on API error
    }

    const data = await response.json();

    if (
      data.results &&
      data.results.length > 0 &&
      data.results[0].urls &&
      data.results[0].urls.regular
    ) {
      return data.results[0].urls.regular; // Use 'regular' size, or 'small' if preferred
    } else {
      console.warn(
        `No Unsplash image found for query: ${city}, ${country}. Returning default fallback.`
      );
      return DEFAULT_FALLBACK_IMAGE_URL; // Fallback if no results
    }
  } catch (error) {
    console.error('Error fetching city image from Unsplash:', error);
    return DEFAULT_FALLBACK_IMAGE_URL; // Fallback on network or other errors
  }
};

// Asynchronously gets the image URL, to be used in components that can handle async operations for setting state.
export const getCityImageUrlWithFallback = async (airport: Airport | null): Promise<string> => {
  if (!airport || !airport.city || !airport.country) {
    // console.warn('Airport details incomplete for image fetching. Returning default fallback.');
    return DEFAULT_FALLBACK_IMAGE_URL;
  }

  try {
    return await getCityImageUrl(airport.city, airport.country);
  } catch (error) {
    // Error is already logged in getCityImageUrl
    return DEFAULT_FALLBACK_IMAGE_URL;
  }
};
