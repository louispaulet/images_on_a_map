const batch = (file) => ({
  file,
  label: `Batch ${file.match(/batch_(\d+)/)?.[1] ?? '?'}`,
});

const collection = ({ id, title, theme, description, files }) => ({
  id,
  title,
  theme,
  description,
  batches: files.map(batch),
});

export const collections = [
  collection({
    id: 'europe-men',
    title: 'Men of Europe',
    theme: 'Portraits',
    description: 'The original face map batches for men across Europe.',
    files: [
      'europe_man_batch_0.geojson',
      'europe_man_batch_1.geojson',
      'europe_man_batch_2.geojson',
      'europe_man_batch_3.geojson',
      'europe_man_batch_4.geojson',
    ],
  }),
  collection({
    id: 'europe-women',
    title: 'Women of Europe',
    theme: 'Portraits',
    description: 'The matching face map batches for women across Europe.',
    files: [
      'europe_woman_batch_0.geojson',
      'europe_woman_batch_1.geojson',
      'europe_woman_batch_2.geojson',
      'europe_woman_batch_3.geojson',
      'europe_woman_batch_4.geojson',
    ],
  }),
  collection({
    id: 'europe-architecture',
    title: 'European Architecture',
    theme: 'Built forms',
    description: 'General architecture prompts from the original archive.',
    files: ['europe_architecture_batch_1.geojson', 'europe_architecture_batch_2.geojson'],
  }),
  collection({
    id: 'typical-houses',
    title: 'Typical Houses',
    theme: 'Built forms',
    description: 'A smaller house study used for the house-focused experiments.',
    files: ['houses_batch_1_batch_0.geojson', 'houses_batch_1_batch_1.geojson'],
  }),
  collection({
    id: 'baroque-still-life',
    title: 'Baroque Still Life',
    theme: 'Cultural scenes',
    description: 'National still life prompt batches with a baroque mood.',
    files: [
      'eu_national_baroque_still_life_prompts_batch_0.geojson',
      'eu_national_baroque_still_life_prompts_batch_1.geojson',
    ],
  }),
  collection({
    id: 'impressionist-garden',
    title: 'Impressionist Garden',
    theme: 'Cultural scenes',
    description: 'Painterly garden prompt batches with soft outdoor palettes.',
    files: [
      'eu_national_impressionist_garden_prompts_batch_0.geojson',
      'eu_national_impressionist_garden_prompts_batch_1.geojson',
    ],
  }),
  collection({
    id: 'national-leaders',
    title: 'National Leaders',
    theme: 'Cultural scenes',
    description: 'Portrait-led national prompts with a more documentary tone.',
    files: [
      'eu_national_leaders_prompts_batch_0.geojson',
      'eu_national_leaders_prompts_batch_1.geojson',
    ],
  }),
  collection({
    id: 'mosaic',
    title: 'Mosaic',
    theme: 'Patterns',
    description: 'Decorative mosaic batches for a geometric visual language.',
    files: ['eu_national_mosaic_prompts_batch_0.geojson', 'eu_national_mosaic_prompts_batch_1.geojson'],
  }),
  collection({
    id: 'mountain',
    title: 'Mountain',
    theme: 'Landscapes',
    description: 'Landscape batches with a calmer, topographic feeling.',
    files: ['eu_national_mountain_prompts_batch_0.geojson', 'eu_national_mountain_prompts_batch_1.geojson'],
  }),
  collection({
    id: 'renaissance-castle',
    title: 'Renaissance Castle',
    theme: 'Built forms',
    description: 'Historic architecture batches with a more classical silhouette.',
    files: [
      'eu_national_renaissance_castle_prompts_batch_0.geojson',
      'eu_national_renaissance_castle_prompts_batch_1.geojson',
    ],
  }),
  collection({
    id: 'travel-poster',
    title: 'Travel Poster',
    theme: 'Posters',
    description: 'Poster-style batches with an optimistic, graphic look.',
    files: [
      'eu_national_travel_poster_prompts_batch_0.geojson',
      'eu_national_travel_poster_prompts_batch_1.geojson',
      'eu_national_travel_poster_prompts_batch_2.geojson',
    ],
  }),
  collection({
    id: 'vintage-poster',
    title: 'Vintage Poster',
    theme: 'Posters',
    description: 'A vintage graphic poster set to round out the current archive.',
    files: [
      'eu_national_vintage_poster_prompts_batch_0.geojson',
      'eu_national_vintage_poster_prompts_batch_1.geojson',
    ],
  }),
];

export const defaultCollectionId = collections[0].id;

export const getCollectionById = (collectionId) =>
  collections.find((collectionEntry) => collectionEntry.id === collectionId) ?? collections[0];

export const getBatchByFile = (collectionEntry, file) =>
  collectionEntry.batches.find((batchEntry) => batchEntry.file === file) ?? collectionEntry.batches[0];
