const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const imageConfigs = {
  hero: [
    {
      name: 'hero-private-jet',
      width: 1920,
      height: 1080,
      quality: 90,
    }
  ],
  destinations: [
    {
      name: 'cape-town-destination',
      width: 800,
      height: 1200,
      quality: 85,
    },
    {
      name: 'johannesburg-destination',
      width: 800,
      height: 1200,
      quality: 85,
    },
    {
      name: 'durban-destination',
      width: 800,
      height: 1200,
      quality: 85,
    }
  ],
  aircraft: [
    {
      name: 'light-jet',
      width: 600,
      height: 400,
      quality: 85,
    },
    {
      name: 'midsize-jet',
      width: 600,
      height: 400,
      quality: 85,
    },
    {
      name: 'heavy-jet',
      width: 600,
      height: 400,
      quality: 85,
    },
    {
      name: 'vip-airliner',
      width: 600,
      height: 400,
      quality: 85,
    }
  ],
  misc: [
    {
      name: 'empty-leg-promo',
      width: 800,
      height: 600,
      quality: 85,
    },
    {
      name: 'logo-white',
      width: 240,
      height: 80,
      quality: 90,
    }
  ]
};

async function optimizeImage(inputPath, outputPath, config) {
  try {
    await sharp(inputPath)
      .resize(config.width, config.height, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: config.quality })
      .toFile(outputPath + '.webp');

    await sharp(inputPath)
      .resize(config.width, config.height, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: config.quality })
      .toFile(outputPath + '.jpg');

    console.log(`✓ Optimized: ${config.name}`);
  } catch (error) {
    console.error(`✗ Error optimizing ${config.name}:`, error);
  }
}

async function processImages() {
  for (const [category, configs] of Object.entries(imageConfigs)) {
    for (const config of configs) {
      const inputPath = path.join(__dirname, '..', 'images-source', category, `${config.name}.{jpg,png}`);
      const outputPath = path.join(__dirname, '..', 'public', 'images', category, config.name);
      
      await optimizeImage(inputPath, outputPath, config);
    }
  }
}

processImages().catch(console.error); 