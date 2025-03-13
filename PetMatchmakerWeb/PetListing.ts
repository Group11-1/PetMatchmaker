const filterButton = document.querySelector<HTMLButtonElement>('.filter-button');
const filterCategories = document.querySelector<HTMLDivElement>('.filter-categories');

//allow users to interact with filter button and see filter options
if (filterButton && filterCategories) {
    filterButton.addEventListener('click', () => {
        filterCategories.style.display = filterCategories.style.display === 'none' ? 'block' : 'none';
    });
}

// our personal key and secret for the petfinder API
const CLIENT_ID: string = "SpVPhvPRJKYA7CcFQVZYjyKLMAcKeMkJRIpTsBX66izcpBVCDj";
const CLIENT_SECRET: string = "WXaCjTAqEdnZw3yTBVJaAxAcdUBI9wdkcqefGLOZ";

//type definition for API photos- must include all sizes because theyre all in different sizes/formats!!
interface PetPhoto {
    small?: string;
    medium?: string;
    large?: string;
    full?: string;
}

interface Pet {
    name: string;
    age: string;
    size: string;
    breeds: { primary: string };
    photos?: PetPhoto[];
}

interface APIResponse {
    animals: Pet[];
}

// cache token so we get a new one after expiration
let cachedToken: string | null = null;
let tokenExpiration: number = 0;

// pbtain the access token from petfinder API using our credentials
async function getAccessToken(): Promise<string | null> {
    const now = Date.now() / 1000; 

    if (cachedToken && now < tokenExpiration) {
        console.log("✅ Using cached access token.");
        return cachedToken;
    }
//accessing the api with methods from petfinder website
    try {
        const response = await fetch("https://api.petfinder.com/v2/oauth2/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`
        });

        const data = await response.json();
        cachedToken = data.access_token;
        tokenExpiration = now + 3600; // have to make sure token isnt expired!!!

        console.log(" New Access Token:", cachedToken);
        return cachedToken;   // console log to test that token is being accessed!
    } catch (error) {
        console.error("Error getting access token:", error);
        return null;
    }
}

// obtain PET INFO from the api
async function searchPets(): Promise<void> {
    const accessToken = await getAccessToken(); //always await access token first

    if (!accessToken) {
        console.error("Failed to get access token!");
        return;
    }
//obtain name that is searched in search bar and find data through petfinder API
    const searchInput = document.querySelector<HTMLInputElement>(".search-container input");
    const petName = searchInput?.value.trim(); //check input from search bar
    let url: string = "https://api.petfinder.com/v2/animals";
    let params: string[] = [];

if(petName){
    params.push(`name=${encodeURIComponent(petName)}`)
}
if(params.length>0){
    url += "?" + params.join("&");
}
console.log("Searching: ",url); //console log to make sure api is searched

//filters cats vs dogs
    if ((document.querySelector("#dog") as HTMLInputElement)?.checked) params.push("type=dog");
    if ((document.querySelector("#cat") as HTMLInputElement)?.checked) params.push("type=cat");

    console.log("Fetching data from:", url);

//fetch method from petfinder website
    try {
        const response = await fetch(url, {
            headers: { "Authorization": `Bearer ${accessToken}` }
        });

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const data: APIResponse = await response.json();
        console.log("API Response:", data); //console log to make sure api is responding correctly with json format
        displayPets(data.animals);
    } catch (error) {
        console.error("Error fetching pet data:", error);
    }
}

// create container and DISPLAY the pets
function displayPets(pets: Pet[]): void {
    const container = document.querySelector<HTMLDivElement>(".pet-listings");

    if (!container) {
        console.error("Container element not found.");
        return;
    }

    container.innerHTML = ""; // Clear previous results!!

    if (!pets || pets.length === 0) {
        container.innerHTML = "<p>No pets found.</p>";
        return;
    }
//we only want to show 6 pets per page based on the prototype
    const petsToShow = pets.slice(0, 6); 

    petsToShow.forEach((pet) => {
        const petDiv = document.createElement("div");
        petDiv.classList.add("pet-listing");
        let petImage: string = "placeholder-pet.jpg"; // put in a default image in case photo doesnt exist?
        if (pet.photos && pet.photos.length > 0) {
            petImage = pet.photos[0].full || pet.photos[0].large || pet.photos[0].medium || pet.photos[0].small || petImage;
        }

        petDiv.innerHTML = `
            <img src="${petImage}" alt="${pet.name}">
            <h3>${pet.name}</h3>
            <p><strong>Breed:</strong> ${pet.breeds.primary || "Unknown"}</p>
            <p><strong>Age:</strong> ${pet.age}</p>
            <p><strong>Size:</strong> ${pet.size}</p>
             <button class="favorite-button"><i class="far fa-heart"></i></button>
        `;

        container?.appendChild(petDiv);
    });
    document.querySelectorAll(".favorite-button").forEach((button) => {
        button.addEventListener("click", (event) => {
            const target = event.target as HTMLElement;
            const heartIcon = target.querySelector("i");

            if (heartIcon) {
                //makes the heart icon go from empty to filled
                if (heartIcon.classList.contains("fas")) {
                    heartIcon.classList.remove("fas");
                    heartIcon.classList.add("far"); 
                } else {
                    heartIcon.classList.remove("far");
                    heartIcon.classList.add("fas");
                }
            }
        });
    });
    console.log("Pets displaying")
}

// function to reset filters back to all empty so user can pick again
function resetFilters(): void {
    document.querySelectorAll<HTMLInputElement>(".filter-group input").forEach(input => {
        input.checked = false;
    });

    const searchInput = document.querySelector<HTMLInputElement>(".search-container input");
    if (searchInput) {
        searchInput.value = "";
    }
}

// Makes sure random pets are displayed AS SOON AS PAGE LOADS so the page wont be empty
document.addEventListener("DOMContentLoaded", searchPets);
// allows user to click the heart icon to favorite pets and fills heart red when favorited
document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    
    if (target.classList.contains("fa-heart")) {
        target.classList.toggle("far"); // Toggle hollow heart
        target.classList.toggle("fas"); // Toggle solid heart
        target.classList.toggle("favorited"); // Toggle red color
    }
});

// event listeners
document.querySelector<HTMLButtonElement>(".search-container button")?.addEventListener("click", searchPets);
document.querySelector<HTMLButtonElement>(".apply-button")?.addEventListener("click", searchPets);
document.querySelector<HTMLButtonElement>(".reset-button")?.addEventListener("click", () => {
    resetFilters();
    searchPets();
});
