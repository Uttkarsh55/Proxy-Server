const fetch = require('node-fetch');

// --- Configuration (Stored as Environment Variables on Netlify) ---
// These variables must be set in the Netlify UI.
const INFLUX_URL = process.env.INFLUX_URL;
const INFLUX_TOKEN = process.env.INFLUX_TOKEN;

// The main handler function
exports.handler = async (event) => {
    // 1. Check if the request method is POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // 2. The ESP8266 sends the Line Protocol data in the raw body (event.body)
    const lineProtocol = event.body;

    if (!lineProtocol) {
        return { statusCode: 400, body: 'Missing data payload.' };
    }

    try {
        // 3. Forward the data securely to InfluxDB Cloud using HTTPS
        const response = await fetch(INFLUX_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Token ${INFLUX_TOKEN}`,
                'Content-Type': 'text/plain'
            },
            body: lineProtocol
        });

        // 4. InfluxDB returns 204 No Content on success. 
        if (response.status === 204) {
            return {
                statusCode: 200, // Success code expected by the ESP8266 code
                body: "Data received and forwarded successfully."
            };
        } else {
            // Handle InfluxDB errors (e.g., 400 Bad Request, 401 Unauthorized)
            const errorText = await response.text();
            return {
                statusCode: response.status,
                body: `InfluxDB Error (${response.status}): ${errorText}`
            };
        }

    } catch (error) {
        console.error("Function execution error:", error);
        return {
            statusCode: 500,
            body: `Internal server error during fetch: ${error.message}`
        };
    }
};
