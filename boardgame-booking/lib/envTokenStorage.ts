// Server-side token storage in .env.local
// This allows automatic calendar access without user authentication

import fs from 'fs';
import path from 'path';

const ENV_PATH = path.join(process.cwd(), '.env.local');

export function saveTokensToEnv(accessToken: string, refreshToken: string) {
  try {
    let envContent = fs.readFileSync(ENV_PATH, 'utf-8');
    
    // Update or add tokens
    if (envContent.includes('GOOGLE_REFRESH_TOKEN=')) {
      envContent = envContent.replace(
        /GOOGLE_REFRESH_TOKEN=.*/,
        `GOOGLE_REFRESH_TOKEN=${refreshToken}`
      );
    } else {
      envContent += `\nGOOGLE_REFRESH_TOKEN=${refreshToken}`;
    }
    
    if (envContent.includes('GOOGLE_ACCESS_TOKEN=')) {
      envContent = envContent.replace(
        /GOOGLE_ACCESS_TOKEN=.*/,
        `GOOGLE_ACCESS_TOKEN=${accessToken}`
      );
    } else {
      envContent += `\nGOOGLE_ACCESS_TOKEN=${accessToken}`;
    }
    
    fs.writeFileSync(ENV_PATH, envContent);
    console.log('✅ Tokens saved to .env.local');
  } catch (error) {
    console.error('❌ Error saving tokens to .env.local:', error);
  }
}

export function getStoredTokens(): { accessToken?: string; refreshToken?: string } {
  const accessToken = process.env.GOOGLE_ACCESS_TOKEN;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  
  return {
    accessToken: accessToken || undefined,
    refreshToken: refreshToken || undefined,
  };
}
