
//use keys to obtain access token. Tokens last 3600 seconds and will need to be requested again each time they expire
// API fetching
const client_ID = "SpVPhvPRJKYA7CcFQVZYjyKLMAcKeMkJRIpTsBX66izcpBVCDj"; //our personal ID
const client_secret = "WXaCjTAqEdnZw3yTBVJaAxAcdUBI9wdkcqefGLOZ"; //our personal key

// Get API Access Token
async function getAccessToken() {
  try {
      const response = await fetch("https://api.petfinder.com/v2/oauth2/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `grant_type=client_credentials&client_id=${client_ID}&client_secret=${client_secret}`
      });

      const data = await response.json();
      console.log("Access Token:", data.access_token);
      return data.access_token; 
  } catch (error) {
      console.error("Error getting access token:", error);
  }
}
// always await a new access token in your functions

  //API is accessed through GET requests and access token
  const options = {
    hostname: 'api.petfinder.com',
    //pull category, action, parameter 1,2, value 1,2 from user input
    path: `/v2/${category}/${action}?${parameter1}=${value1}&${parameter2}=${value2}`,
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${access_token}`
    }
};
