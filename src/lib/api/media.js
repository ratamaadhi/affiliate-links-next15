import { getStrapiURL } from './api';

function getStrapiMedia(media) {
  const imageUrl =
    media !== null
      ? media?.url.startsWith('/')
        ? getStrapiURL(media.url)
        : media?.url
      : null;
  return imageUrl;
}

function myLoader(load) {
  return `${load.src}?w=${load.width}&q=${load.quality || 75}`;
}

export { getStrapiMedia, myLoader };
