#!/bin/sh

# List of variables to replace
vars="
NEXT_PUBLIC_DEFAULT_HTTP_RELAY
NEXT_PUBLIC_HOMEGATE_URL
NEXT_PUBLIC_PKARR_RELAYS
NEXT_PUBLIC_CDN_URL
NEXT_PUBLIC_HOMESERVER
NEXT_PUBLIC_NEXUS_URL
"

echo "Injecting runtime environment variables..."

# 1. Determine the correct search path
# In standalone mode, static files are usually in .next/static
SEARCH_PATH="./.next/static"

if [ ! -d "$SEARCH_PATH" ]; then
  echo "Error: $SEARCH_PATH not found. Checking current directory..."
  SEARCH_PATH="."
fi

for var in $vars; do
  # Get value
  value=$(eval echo \$$var)
  
  if [ -n "$value" ]; then
    # STRIP SINGLE QUOTES if they were passed in from Ansible/Shell
    # This turns '["http..."]' into ["http..."]
    clean_value=$(echo "$value" | sed "s/^'//;s/'$//")
    
    echo "Replacing APP_PLACEHOLDER_$var with $clean_value"
    
    # Use find to catch all JS files. 
    # We use '|' as delimiter because URLs have '/'
    find "$SEARCH_PATH" -type f -name "*.js" -exec sed -i "s|APP_PLACEHOLDER_$var|$clean_value|g" {} +
  fi
done

echo "Injection complete. Starting Next.js..."
exec "$@"
