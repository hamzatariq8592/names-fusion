
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Preparing Names Fusion WordPress plugin with React...');

// Define the plugin directory and plugin name
const pluginName = 'names-fusion';
const pluginDir = path.join(__dirname, pluginName);

// Function to check if plugin structure is valid
function validatePluginStructure() {
  console.log('Validating plugin structure...');
  
  // Check if php file exists and doesn't have duplicate function declarations
  const phpFilePath = path.join(pluginDir, pluginName + '.php');
  if (!fs.existsSync(phpFilePath)) {
    console.error(`❌ Plugin PHP file not found: ${phpFilePath}`);
    return false;
  }
  
  const phpContent = fs.readFileSync(phpFilePath, 'utf8');
  const shortcodeFunctionCount = (phpContent.match(/function\s+names_fusion_/g) || []).length;
  const uniqueShortcodeFunctions = new Set(phpContent.match(/function\s+names_fusion_\w+/g) || []);
  
  if (shortcodeFunctionCount !== uniqueShortcodeFunctions.size) {
    console.error('❌ Duplicate shortcode functions detected in PHP file!');
    console.log('Functions found:', Array.from(uniqueShortcodeFunctions).join(', '));
    return false;
  }
  
  return true;
}

// First build the React app
try {
  execSync('node build-wordpress.js', { stdio: 'inherit' });
  
  // Validate plugin structure before packaging
  if (!validatePluginStructure()) {
    console.error('❌ Plugin structure validation failed. Please fix the issues before packaging.');
    process.exit(1);
  }
  
  console.log('\nCreating plugin zip file...');
  
  // Clean up any existing zip
  const zipPath = path.join(__dirname, pluginName + '-plugin.zip');
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
    console.log(`Removed existing zip file: ${zipPath}`);
  }
  
  // Create zip file
  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip', {
    zlib: { level: 9 } // Maximum compression
  });
  
  output.on('close', function() {
    console.log(`✅ Plugin zip created successfully! (${archive.pointer()} bytes)`);
    console.log(`📦 File: ${pluginName}-plugin.zip`);
    console.log('\nInstallation instructions:');
    console.log('1. Go to WordPress Admin > Plugins > Add New > Upload Plugin');
    console.log('2. Upload the names-fusion-plugin.zip file');
    console.log('3. Activate the plugin');
    console.log('4. Add shortcode [names_fusion] for jQuery version or [names_fusion_react] for React version to your page');
    console.log('\nTroubleshooting:');
    console.log('- If you encounter any errors, check the WordPress and server error logs');
    console.log('- Make sure to deactivate and delete any previous versions before installing a new one');
    console.log('- Visit /wp-content/plugins/names-fusion/debug.php?debug_token=namesfusion2024 to check for issues');
  });
  
  archive.on('error', function(err) {
    throw err;
  });
  
  archive.pipe(output);
  
  // Make sure all required directories exist
  const directories = {
    css: path.join(pluginDir, 'css'),
    js: path.join(pluginDir, 'js'),
    reactBuild: path.join(pluginDir, 'react-build'),
    reactAssets: path.join(pluginDir, 'react-build', 'assets')
  };
  
  // Create all required directories
  Object.values(directories).forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'index.php'), '<?php // Silence is golden.');
    }
  });
  
  // Ensure CSS file exists
  if (!fs.existsSync(path.join(directories.css, 'names-fusion.css'))) {
    fs.writeFileSync(path.join(directories.css, 'names-fusion.css'), '/* Names Fusion Styles */');
  }
  
  // Ensure JS file exists
  if (!fs.existsSync(path.join(directories.js, 'names-fusion.js'))) {
    fs.writeFileSync(path.join(directories.js, 'names-fusion.js'), '// Names Fusion jQuery Script');
  }
  
  // Add the plugin directory to the zip with the normalized name
  archive.directory(pluginDir, pluginName);
  
  archive.finalize();
  
} catch (error) {
  console.error('❌ Process failed:', error);
  process.exit(1);
}
