const client_id = 'SpVPhvPRJKYA7CcFQVZYjyKLMAcKeMkJRIpTsBX66izcpBVCDj'; //our personal ID
const client_secret = 'WXaCjTAqEdnZw3yTBVJaAxAcdUBI9wdkcqefGLOZ'; //our personal key
const https = require('https');
//use keys to obtain access token. Tokens last 3600 seconds and will need to be requested again each time they expire
const getOAuth = function(){
return fetch('https://api.petfinder.com/v2/oauth2/token', {
    method: 'POST',
    body: 'grant_type=client_credentials&client_id=SpVPhvPRJKYA7CcFQVZYjyKLMAcKeMkJRIpTsBX66izcpBVCDj&client_secret=WXaCjTAqEdnZw3yTBVJaAxAcdUBI9wdkcqefGLOZ'
    ,headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
  }).then(function(resp){
    return resp.json();
  }).then(function(data){
    token = data.access_token;
    tokenType = data.token_type;
    expires = new Date().getTime() + (data.expires_in * 3600);})
    .catch(error => {
        console.error('Error obtaining access toekn: '.error.response ? error.response.data : error.message);
    });
  };
  //obtain new token if curr token expires
  const makeCall = () =>{
    if(!expires||expires-new Date().getTime()<1){
        getOAuth().then(function(){});
    }
  };

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
