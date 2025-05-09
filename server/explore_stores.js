const axios = require('axios');

async function getAccessToken() {
    const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
        params: {
            client_id: process.env.TWITCH_CLIENT_ID,
            client_secret: process.env.TWITCH_CLIENT_SECRET,
            grant_type: 'client_credentials'
        }
    });
    return response.data.access_token;
}

async function makeRequest(endpoint, body) {
    const accessToken = await getAccessToken();
    const response = await axios.post(`https://api.igdb.com/v4/${endpoint}`, body, {
        headers: {
            'Client-ID': process.env.TWITCH_CLIENT_ID,
            'Authorization': `Bearer ${accessToken}`
        }
    });
    return response.data;
}

async function exploreStores() {
    try {
        // 1. Get store fields
        console.log('\n1. Getting store fields...');
        const storeFields = await makeRequest('stores', 'fields *; limit 1;');
        console.log('Store fields:', JSON.stringify(storeFields, null, 2));

        // 2. Get a sample store
        console.log('\n2. Getting a sample store...');
        const sampleStore = await makeRequest('stores', 'fields *; limit 1;');
        console.log('Sample store:', JSON.stringify(sampleStore, null, 2));

        // 3. Get games with stores
        console.log('\n3. Getting a game with its stores...');
        const gameWithStores = await makeRequest('games', 'fields name, stores.*; where stores != null; limit 1;');
        console.log('Game with stores:', JSON.stringify(gameWithStores, null, 2));

        // 4. Get store categories
        console.log('\n4. Getting store categories...');
        const storeCategories = await makeRequest('store_categories', 'fields *; limit 10;');
        console.log('Store categories:', JSON.stringify(storeCategories, null, 2));

        // 5. Get store websites
        console.log('\n5. Getting store websites...');
        const storeWebsites = await makeRequest('store_websites', 'fields *; limit 10;');
        console.log('Store websites:', JSON.stringify(storeWebsites, null, 2));

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

exploreStores(); 