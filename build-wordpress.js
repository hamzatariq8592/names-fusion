
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Building Names Fusion React component for WordPress...');

// Define plugin name consistently
const pluginName = 'names-fusion';

// Define all required directories
const pluginDir = path.join(__dirname, pluginName);
const buildDir = path.join(pluginDir, 'react-build');
const assetsDir = path.join(buildDir, 'assets');
const cssDir = path.join(pluginDir, 'css');
const jsDir = path.join(pluginDir, 'js');

console.log('Plugin directory:', pluginDir);
console.log('Build directory:', buildDir);
console.log('Assets directory:', assetsDir);

// Check for dependencies before building
function checkDependencies() {
  console.log('Checking for required dependencies...');
  
  try {
    require.resolve('terser');
    console.log('✅ Terser is installed.');
  } catch (e) {
    console.warn('⚠️ Terser is not installed. Build will use esbuild for minification instead.');
    console.warn('   To use Terser for minification, install it with: npm install terser --save-dev');
  }
}

// Check for any name inconsistencies or casing issues in the directory structure
function checkForDuplicatePluginFolders() {
  const parentDir = path.dirname(pluginDir);
  const allDirectories = fs.readdirSync(parentDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
  
  const possiblePluginDirs = allDirectories.filter(name => 
    name.toLowerCase().includes('names') && name.toLowerCase().includes('fusion'));
  
  if (possiblePluginDirs.length > 1) {
    console.warn('⚠️ Warning: Possible duplicate plugin directories detected:');
    possiblePluginDirs.forEach(dir => console.warn(` - ${dir}`));
    console.warn('This might cause conflicts when installing in WordPress.');
  }
}

// Check for potential issues before building
checkDependencies();
checkForDuplicatePluginFolders();

// Create all required directories
const directories = [pluginDir, buildDir, assetsDir, cssDir, jsDir];

directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    console.log(`Creating directory: ${dir}`);
    try {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Successfully created directory: ${dir}`);
    } catch (error) {
      console.error(`❌ Failed to create directory: ${dir}`, error);
      throw error; // Rethrow to stop the process
    }
  } else {
    console.log(`Directory already exists: ${dir}`);
  }
});

// Create index.php files to prevent directory listing
const indexPhpContent = '<?php // Silence is golden.';
[pluginDir, buildDir, assetsDir, cssDir, jsDir].forEach(dir => {
  const indexPath = path.join(dir, 'index.php');
  if (!fs.existsSync(indexPath)) {
    console.log(`Creating index.php in: ${indexPath}`);
    try {
      fs.writeFileSync(indexPath, indexPhpContent);
      console.log(`✅ Successfully created index.php in: ${indexPath}`);
    } catch (error) {
      console.error(`❌ Failed to create index.php in: ${indexPath}`, error);
      throw error; // Rethrow to stop the process
    }
  } else {
    console.log(`index.php already exists in: ${dir}`);
  }
});

// Ensure CSS and JS files exist
const cssFile = path.join(cssDir, 'names-fusion.css');
if (!fs.existsSync(cssFile)) {
  console.log(`Creating CSS file: ${cssFile}`);
  try {
    fs.writeFileSync(cssFile, '/* Names Fusion Styles */');
    console.log(`✅ Successfully created CSS file: ${cssFile}`);
  } catch (error) {
    console.error(`❌ Failed to create CSS file: ${cssFile}`, error);
    throw error; // Rethrow to stop the process
  }
} else {
  console.log(`CSS file already exists: ${cssFile}`);
}

const jsFile = path.join(jsDir, 'names-fusion.js');
if (!fs.existsSync(jsFile)) {
  console.log(`Creating JS file: ${jsFile}`);
  try {
    fs.writeFileSync(jsFile, '/* Names Fusion jQuery Script */');
    console.log(`✅ Successfully created JS file: ${jsFile}`);
  } catch (error) {
    console.error(`❌ Failed to create JS file: ${jsFile}`, error);
    throw error; // Rethrow to stop the process
  }
} else {
  console.log(`JS file already exists: ${jsFile}`);
}

try {
  // Clean the build directory before building
  console.log('Cleaning build directory...');
  if (fs.existsSync(buildDir)) {
    const files = fs.readdirSync(buildDir);
    files.forEach(file => {
      const filePath = path.join(buildDir, file);
      if (file !== 'index.php' && !fs.lstatSync(filePath).isDirectory()) {
        fs.unlinkSync(filePath);
        console.log(`Deleted: ${filePath}`);
      }
    });
  }
  
  // Build the React app
  console.log('Running Vite build command...');
  try {
    execSync('npx vite build --config vite.config.wordpress.ts', { stdio: 'inherit' });
    console.log('\n✅ Build process completed successfully!');
  } catch (error) {
    console.error('❌ Build command failed:', error.message);
    console.log('\nTrying to build without minification...');
    
    // Fallback to build without minification if terser is not available
    execSync('npx vite build --config vite.config.wordpress.ts --mode=development', { stdio: 'inherit' });
    console.log('\n✅ Build process completed with development mode (unminified).');
  }
  
  // Verify the build output
  console.log('\nVerifying build output...');
  
  // Check if the build directory exists
  if (fs.existsSync(buildDir)) {
    console.log(`✅ Build directory exists: ${buildDir}`);
    
    // List files in the build directory
    const buildFiles = fs.readdirSync(buildDir);
    console.log('Files in build directory:', buildFiles);
    
    // Check if the assets directory exists
    if (fs.existsSync(assetsDir)) {
      console.log(`✅ Assets directory exists: ${assetsDir}`);
      
      // List files in the assets directory
      const assetFiles = fs.readdirSync(assetsDir);
      console.log('Files in assets directory:', assetFiles);
      
      // Check for JS and CSS files
      const jsAssets = assetFiles.filter(file => file.endsWith('.js'));
      const cssAssets = assetFiles.filter(file => file.endsWith('.css'));
      
      if (jsAssets.length > 0) {
        console.log('✅ JavaScript assets found:', jsAssets);
      } else {
        console.error('❌ No JavaScript assets found in:', assetsDir);
      }
      
      if (cssAssets.length > 0) {
        console.log('✅ CSS assets found:', cssAssets);
      } else {
        console.error('❌ No CSS assets found in:', assetsDir);
      }
    } else {
      console.error(`❌ Assets directory does not exist: ${assetsDir}`);
    }
  } else {
    console.error(`❌ Build directory does not exist: ${buildDir}`);
  }
  
} catch (error) {
  console.error('❌ Build process failed:', error);
  process.exit(1);
}
