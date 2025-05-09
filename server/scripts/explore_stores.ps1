# Get the access token
Write-Host "Getting access token..."
$tokenResponse = Invoke-RestMethod -Uri "https://id.twitch.tv/oauth2/token" `
    -Method Post `
    -ContentType "application/json" `
    -Body @{
        client_id = $env:TWITCH_CLIENT_ID
        client_secret = $env:TWITCH_CLIENT_SECRET
        grant_type = "client_credentials"
    }

$accessToken = $tokenResponse.access_token

if (-not $accessToken) {
    Write-Host "Failed to get access token"
    exit 1
}

Write-Host "Access token obtained successfully"

# Function to make IGDB API requests
function Make-IGDBRequest {
    param (
        [string]$endpoint,
        [string]$body
    )
    
    $headers = @{
        "Client-ID" = $env:TWITCH_CLIENT_ID
        "Authorization" = "Bearer $accessToken"
    }
    
    $response = Invoke-RestMethod -Uri "https://api.igdb.com/v4/$endpoint" `
        -Method Post `
        -Headers $headers `
        -Body $body
    
    return $response
}

# 1. Get store fields
Write-Host "`n1. Getting store fields..."
$storeFields = Make-IGDBRequest -endpoint "stores" -body "fields *; limit 1;"
Write-Host "Store fields:"
$storeFields | ConvertTo-Json -Depth 10

# 2. Get a sample store
Write-Host "`n2. Getting a sample store..."
$sampleStore = Make-IGDBRequest -endpoint "stores" -body "fields *; limit 1;"
Write-Host "Sample store:"
$sampleStore | ConvertTo-Json -Depth 10

# 3. Get games with stores
Write-Host "`n3. Getting a game with its stores..."
$gameWithStores = Make-IGDBRequest -endpoint "games" -body "fields name, stores.*; where stores != null; limit 1;"
Write-Host "Game with stores:"
$gameWithStores | ConvertTo-Json -Depth 10

# 4. Get store categories
Write-Host "`n4. Getting store categories..."
$storeCategories = Make-IGDBRequest -endpoint "store_categories" -body "fields *; limit 10;"
Write-Host "Store categories:"
$storeCategories | ConvertTo-Json -Depth 10

# 5. Get store websites
Write-Host "`n5. Getting store websites..."
$storeWebsites = Make-IGDBRequest -endpoint "store_websites" -body "fields *; limit 10;"
Write-Host "Store websites:"
$storeWebsites | ConvertTo-Json -Depth 10

Write-Host "`nExploration complete! Check the output above for the correct field names and relationships." 