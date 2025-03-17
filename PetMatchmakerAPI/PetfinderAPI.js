const fetch = require("node-fetch");

const client_ID = "SpVPhvPRJKYA7CcFQVZYjyKLMAcKeMkJRIpTsBX66izcpBVCDj"; //our personal ID
const client_secret = "WXaCjTAqEdnZw3yTBVJaAxAcdUBI9wdkcqefGLOZ"; //our personal key

let accessToken = null;
let tokenExpiration = null;

// Function to get or refresh the Petfinder API Access Token
async function getAccessToken() {
  if (accessToken && tokenExpiration && Date.now() < tokenExpiration) {
    return accessToken; // Use existing token if valid
  }

  try {
    const response = await fetch("https://api.petfinder.com/v2/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=client_credentials&client_id=${client_ID}&client_secret=${client_secret}`,
    });

    const data = await response.json();

    if (response.ok) {
      accessToken = data.access_token;
      tokenExpiration = Date.now() + data.expires_in * 1000;
      return accessToken;
    } else {
      throw new Error("Failed to get access token");
    }
  } catch (error) {
    console.error("Error getting access token:", error);
    throw error;
  }
}

// Fetch available pets
async function getAvailablePets() {
  try {
    const token = await getAccessToken();
    const response = await fetch("https://api.petfinder.com/v2/animals", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    return await response.json();
  } catch (error) {
    console.error("Error fetching pets:", error);
    throw error;
  }
}

// Export all functions as a single object
const petfinderAPI = {
  getAccessToken,
  getAvailablePets,
};

module.exports = petfinderAPI;
