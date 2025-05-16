#!/usr/bin/env node

/**
 * Script to detect and optionally remove console.log statements from source code
 * Run with --fix to automatically replace console.log statements with nothing
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Parse command line arguments
const args = process.argv.slice(2);
const shouldFix = args.includes('--fix');
const shouldList = args.includes('--list') || !shouldFix;

// Directory to search
const rootDir = path.resolve(__dirname, '../src');

// Find files with console.log statements using grep
try {
  const grepCommand = `grep -r "console.log(" ${rootDir} --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"`;
  const output = execSync(grepCommand, { encoding: 'utf-8' });
  
  const lines = output.split('\n').filter(Boolean);
  
  if (lines.length === 0) {
    console.log('✅ No console.log statements found.');
    process.exit(0);
  }
  
  if (shouldList) {
    console.log(`Found ${lines.length} console.log statements:`);
    lines.forEach(line => {
      console.log(`- ${line}`);
    });
    
    if (!shouldFix) {
      console.log(`\nRun with --fix to remove these console.log statements`);
      process.exit(1);
    }
  }
  
  if (shouldFix) {
    const fileMatches = {};
    
    // Group by file
    lines.forEach(line => {
      const [filePath] = line.split(':');
      if (!fileMatches[filePath]) {
        fileMatches[filePath] = [];
      }
      fileMatches[filePath].push(line);
    });
    
    // Process each file
    Object.keys(fileMatches).forEach(filePath => {
      let fileContent = fs.readFileSync(filePath, 'utf-8');
      
      // Replace console.log statements with nothing
      // This regex aims to match complete console.log statements including trailing semicolons
      // It specifically looks for console.log calls with matching parentheses
      const regex = /console\.log\s*\([^)]*\)\s*;?/g;
      const newContent = fileContent.replace(regex, '');
      
      if (fileContent !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf-8');
        console.log(`✅ Removed console.log statements from ${filePath}`);
      }
    });
    
    console.log(`\n✅ Removed ${lines.length} console.log statements from ${Object.keys(fileMatches).length} files.`);
  }
} catch (error) {
  if (error.status === 1 && error.stderr.toString().includes('No such file or directory')) {
    console.log('✅ No console.log statements found.');
    process.exit(0);
  }
  
  console.error('❌ Error searching for console.log statements:', error.message);
  process.exit(1);
} 