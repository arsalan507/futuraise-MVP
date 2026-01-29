#!/usr/bin/env node
// Environment Variables Verification Script
// Run with: node scripts/verify-env.js

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying FuturAIse Environment Setup...\n');

// Check if .env.local exists
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local file not found!');
  console.log('📝 Run: cp .env.example .env.local');
  console.log('   Then edit .env.local with your keys\n');
  process.exit(1);
}

console.log('✅ .env.local file exists\n');

// Load environment variables
require('dotenv').config({ path: envPath });

// Check each required variable
const checks = [
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    pattern: /^https:\/\/.+\.supabase\.co$/,
    example: 'https://xxxxx.supabase.co'
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: true,
    pattern: /^eyJ/,
    example: 'eyJhbGc...'
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    required: true,
    pattern: /^eyJ/,
    example: 'eyJhbGc...'
  },
  {
    name: 'ANTHROPIC_API_KEY',
    required: true,
    pattern: /^sk-ant-/,
    example: 'sk-ant-...'
  },
  {
    name: 'NEXT_PUBLIC_APP_URL',
    required: false,
    pattern: /^https?:\/\//,
    example: 'http://localhost:3000'
  }
];

let allGood = true;

checks.forEach(check => {
  const value = process.env[check.name];

  if (!value) {
    if (check.required) {
      console.error(`❌ ${check.name} is missing`);
      console.log(`   Add: ${check.name}=${check.example}\n`);
      allGood = false;
    } else {
      console.warn(`⚠️  ${check.name} is optional (using default)`);
    }
    return;
  }

  if (check.pattern && !check.pattern.test(value)) {
    console.error(`❌ ${check.name} format looks incorrect`);
    console.log(`   Expected format: ${check.example}`);
    console.log(`   Got: ${value.substring(0, 20)}...\n`);
    allGood = false;
    return;
  }

  // Show masked value
  const masked = value.length > 10
    ? value.substring(0, 10) + '...' + value.substring(value.length - 4)
    : value.substring(0, 10) + '...';

  console.log(`✅ ${check.name}`);
  console.log(`   ${masked}\n`);
});

// Summary
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
if (allGood) {
  console.log('✅ All environment variables configured correctly!\n');
  console.log('🚀 You can now run: npm run dev\n');
} else {
  console.log('❌ Please fix the issues above before running the app\n');
  process.exit(1);
}
