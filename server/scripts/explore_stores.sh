#!/bin/bash

# Get the access token
echo "Getting access token..."
TOKEN_RESPONSE=$(curl -s -X POST "https://id.twitch.tv/oauth2/token" \
  -H "Content-Type: application/json" \
  -d "{
    \"client_id\": \"$TWITCH_CLIENT_ID\",
    \"client_secret\": \"$TWITCH_CLIENT_SECRET\",
    \"grant_type\": \"client_credentials\"
  }")

ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.access_token')

if [ -z "$ACCESS_TOKEN" ]; then
    echo "Failed to get access token"
    exit 1
fi

echo "Access token obtained successfully"

# Function to make IGDB API requests
make_request() {
    local endpoint=$1
    local body=$2
    
    curl -s -X POST "https://api.igdb.com/v4/$endpoint" \
        -H "Client-ID: $TWITCH_CLIENT_ID" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -d "$body"
}

# 1. Get store fields
echo -e "\n1. Getting store fields..."
STORE_FIELDS=$(make_request "stores" "fields *; limit 1;")
echo "Store fields:"
echo $STORE_FIELDS | jq '.'

# 2. Get a sample store
echo -e "\n2. Getting a sample store..."
SAMPLE_STORE=$(make_request "stores" "fields *; limit 1;")
echo "Sample store:"
echo $SAMPLE_STORE | jq '.'

# 3. Get games with stores
echo -e "\n3. Getting a game with its stores..."
GAME_WITH_STORES=$(make_request "games" "fields name, stores.*; where stores != null; limit 1;")
echo "Game with stores:"
echo $GAME_WITH_STORES | jq '.'

# 4. Get store categories
echo -e "\n4. Getting store categories..."
STORE_CATEGORIES=$(make_request "store_categories" "fields *; limit 10;")
echo "Store categories:"
echo $STORE_CATEGORIES | jq '.'

# 5. Get store websites
echo -e "\n5. Getting store websites..."
STORE_WEBSITES=$(make_request "store_websites" "fields *; limit 10;")
echo "Store websites:"
echo $STORE_WEBSITES | jq '.'

echo -e "\nExploration complete! Check the output above for the correct field names and relationships." 