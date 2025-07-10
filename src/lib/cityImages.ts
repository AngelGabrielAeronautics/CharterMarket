import { Airport } from '@/types/airport';
import { placeholders } from '@/utils/placeholder-utils';

const UNSPLASH_ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;

// Collection of curated high-quality cityscape images
const CURATED_CITY_IMAGES: Record<string, string> = {
  // Major international cities
  'london': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'new york': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'dubai': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'singapore': 'https://images.unsplash.com/photo-1565967511849-76a60a516170?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'hong kong': 'https://images.unsplash.com/photo-1506970845246-18f21d533b20?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'sydney': 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'rome': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'barcelona': 'https://images.unsplash.com/photo-1583422409516-2895a77efded?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'amsterdam': 'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'istanbul': 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'bangkok': 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'cape town': 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'johannesburg': 'https://images.unsplash.com/photo-1577948000111-9c970dfe3743?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'rio de janeiro': 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'san francisco': 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'los angeles': 'https://images.unsplash.com/photo-1580655653885-65763b2597d0?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'chicago': 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'toronto': 'https://images.unsplash.com/photo-1517090504586-fde19ea6066f?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'vancouver': 'https://images.unsplash.com/photo-1559511260-66a654ae982a?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'berlin': 'https://images.unsplash.com/photo-1560969184-10fe8719e047?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'munich': 'https://images.unsplash.com/photo-1595867818082-083862f3d630?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'vienna': 'https://images.unsplash.com/photo-1516550893885-985c994c9395?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'zurich': 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'geneva': 'https://images.unsplash.com/photo-1538332576228-eb5b4c4de6f5?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'madrid': 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'lisbon': 'https://images.unsplash.com/photo-1588535684923-900727736ac0?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
};

// Unsplash collections with high-quality aerial and cityscape photography
const STYLIZED_COLLECTIONS = [
  '317099', // Aerial city views
  '3694365', // City aerials
  '4332580', // Stylish city skylines
  '1538150', // Luxury travel destinations
  '8961398', // Premium travel destinations
];

// This function gets a city image from the Unsplash API based on the city name
export const getCityImageUrl = async (city: string, country: string): Promise<string> => {
  if (!city) return placeholders.city('Default City');
  
  // First check if we have a curated image for this city
  const cityLower = city.toLowerCase();
  if (CURATED_CITY_IMAGES[cityLower]) {
    return CURATED_CITY_IMAGES[cityLower];
  }

  if (!UNSPLASH_ACCESS_KEY) {
    console.warn('Unsplash Access Key is not configured. Using placeholder image.');
    return placeholders.city(city);
  }

  // Get a random collection ID for variety
  const randomCollectionIndex = Math.floor(Math.random() * STYLIZED_COLLECTIONS.length);
  const collectionId = STYLIZED_COLLECTIONS[randomCollectionIndex];

  // First attempt: Search within curated collections with city name
  let query = encodeURIComponent(`${city} skyline aerial`);
  let url = `https://api.unsplash.com/search/photos?query=${query}&collections=${collectionId}&per_page=1&orientation=landscape&content_filter=high`;

  try {
    let response = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        'Accept-Version': 'v1',
      },
    });

    if (!response.ok) {
      console.error(`Unsplash API error (city query): ${response.status} ${response.statusText}`);
      // Don't return yet, try the fallback query
    }

    let data = await response.json();

    if (data.results && data.results.length > 0 && data.results[0].urls.regular) {
      // Add quality parameters for better image
      const imageUrl = new URL(data.results[0].urls.regular);
      imageUrl.searchParams.set('q', '90');
      imageUrl.searchParams.set('auto', 'format');
      imageUrl.searchParams.set('fit', 'crop');
      return imageUrl.toString();
    }

    // Second attempt: Search with more generic terms
    console.warn(`No Unsplash image for "${city}" in collections, trying generic search...`);
    query = encodeURIComponent(`${city} ${country} cityscape skyline`);
    url = `https://api.unsplash.com/search/photos?query=${query}&per_page=1&orientation=landscape&content_filter=high`;

    response = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        'Accept-Version': 'v1',
      },
    });

    if (!response.ok) {
      console.error(
        `Unsplash API error (city+country query): ${response.status} ${response.statusText}`
      );
      const errorData = await response.json();
      console.error('Unsplash error details:', errorData);
      return placeholders.city(city);
    }

    data = await response.json();

    if (data.results && data.results.length > 0 && data.results[0].urls.regular) {
      // Add quality parameters for better image
      const imageUrl = new URL(data.results[0].urls.regular);
      imageUrl.searchParams.set('q', '90');
      imageUrl.searchParams.set('auto', 'format');
      imageUrl.searchParams.set('fit', 'crop');
      return imageUrl.toString();
    }

    // Third attempt: Try just the country with aerial view
    console.warn(`No Unsplash image for "${city}, ${country}". Trying country only...`);
    query = encodeURIComponent(`${country} aerial view`);
    url = `https://api.unsplash.com/search/photos?query=${query}&per_page=1&orientation=landscape&content_filter=high`;

    response = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        'Accept-Version': 'v1',
      },
    });

    if (!response.ok) {
      return placeholders.city(city);
    }

    data = await response.json();

    if (data.results && data.results.length > 0 && data.results[0].urls.regular) {
      // Add quality parameters for better image
      const imageUrl = new URL(data.results[0].urls.regular);
      imageUrl.searchParams.set('q', '90');
      imageUrl.searchParams.set('auto', 'format');
      imageUrl.searchParams.set('fit', 'crop');
      return imageUrl.toString();
    }

    // Final fallback
    console.warn(
      `No Unsplash image found for query: ${city}, ${country}. Using placeholder.`
    );
    return placeholders.city(city);
  } catch (error) {
    console.error('Error fetching city image from Unsplash:', error);
    return placeholders.city(city);
  }
};

// Asynchronously gets the image URL, to be used in components that can handle async operations for setting state.
export const getCityImageUrlWithFallback = async (airport: Airport | null): Promise<string> => {
  if (!airport || !airport.city || !airport.country) {
    // console.warn('Airport details incomplete for image fetching. Using placeholder.');
    return placeholders.city('Default City');
  }

  try {
    return await getCityImageUrl(airport.city, airport.country);
  } catch (error) {
    // Error is already logged in getCityImageUrl
    return placeholders.city(airport.city);
  }
};
