#!/usr/bin/env node

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const publicDir = join(projectRoot, 'public');

// Colores para output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Archivos JSON a verificar (migrado a API real; sin referencias locales)
const jsonFiles = [];

// Patrones de propiedades que contienen rutas de imágenes
const imageProperties = [
  'photoUrl',
  'avatarUrl',
  'imageUrl',
  'src',
  'icon',
  'logo',
  'background'
];

function extractImagePaths(obj, paths = new Set()) {
  if (typeof obj !== 'object' || obj === null) {
    return paths;
  }

  if (Array.isArray(obj)) {
    obj.forEach(item => extractImagePaths(item, paths));
  } else {
    Object.entries(obj).forEach(([key, value]) => {
      if (imageProperties.includes(key) && typeof value === 'string') {
        // Solo procesar rutas que empiecen con / (rutas absolutas del sitio)
        if (value.startsWith('/')) {
          paths.add(value);
        }
      } else if (typeof value === 'object') {
        extractImagePaths(value, paths);
      }
    });
  }

  return paths;
}

function checkAssetExists(assetPath) {
  // Remover el / inicial para construir la ruta del archivo
  const relativePath = assetPath.startsWith('/') ? assetPath.slice(1) : assetPath;
  const fullPath = join(publicDir, relativePath);
  return existsSync(fullPath);
}

function main() {
  log('blue', '🔍 Verificando assets estáticos...');
  
  const allImagePaths = new Set();
  const missingAssets = [];
  const checkedFiles = [];

  // Procesar cada archivo JSON (si existieran)
  if (jsonFiles.length === 0) {
    log('blue', 'ℹ️  Sin archivos JSON locales que procesar. Integración con API activa.');
  } else {
    for (const jsonFile of jsonFiles) {
      const filePath = join(projectRoot, jsonFile);
      
      if (!existsSync(filePath)) {
        log('yellow', `⚠️  Archivo no encontrado: ${jsonFile}`);
        continue;
      }
  
      try {
        const content = readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);
        const imagePaths = extractImagePaths(data);
        
        imagePaths.forEach(path => allImagePaths.add(path));
        checkedFiles.push(jsonFile);
        
        log('green', `✅ Procesado: ${jsonFile} (${imagePaths.size} rutas encontradas)`);
      } catch (error) {
        log('red', `❌ Error procesando ${jsonFile}: ${error.message}`);
      }
    }
  }

  // Verificar existencia de cada asset
  log('blue', `\n🔍 Verificando ${allImagePaths.size} assets únicos...`);
  
  for (const assetPath of allImagePaths) {
    if (!checkAssetExists(assetPath)) {
      missingAssets.push(assetPath);
    }
  }

  // Reporte final
  console.log('\n' + '='.repeat(60));
  log('blue', '📊 REPORTE DE ASSETS ESTÁTICOS');
  console.log('='.repeat(60));
  
  console.log(`📁 Archivos JSON procesados: ${checkedFiles.length}`);
  console.log(`🖼️  Assets únicos encontrados: ${allImagePaths.size}`);
  console.log(`✅ Assets existentes: ${allImagePaths.size - missingAssets.length}`);
  console.log(`❌ Assets faltantes: ${missingAssets.length}`);

  if (missingAssets.length > 0) {
    console.log('\n' + '⚠️  ASSETS FALTANTES:'.padEnd(60, '-'));
    missingAssets.forEach(asset => {
      log('red', `   ${asset}`);
    });
    
    console.log('\n💡 SOLUCIONES:');
    console.log('   1. Crear placeholder SVG: npm run create-placeholder <ruta>');
    console.log('   2. Corregir ruta en archivo JSON correspondiente');
    console.log('   3. Añadir archivo real al directorio public/');
    
    process.exit(1);
  } else {
    log('green', '\n🎉 ¡Todos los assets están presentes!');
    process.exit(0);
  }
}

// Ejecutar si es el archivo principal
if (import.meta.url.startsWith('file:') && process.argv[1] && import.meta.url.endsWith(process.argv[1])) {
  main();
} else if (process.argv[1] && process.argv[1].endsWith('check-public-assets.mjs')) {
  main();
}

export { extractImagePaths, checkAssetExists };