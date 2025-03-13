var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _a, _b, _c;
var filterButton = document.querySelector('.filter-button');
var filterCategories = document.querySelector('.filter-categories');
//allow users to interact with filter button and see filter options
if (filterButton && filterCategories) {
    filterButton.addEventListener('click', function () {
        filterCategories.style.display = filterCategories.style.display === 'none' ? 'block' : 'none';
    });
}
// our personal key and secret for the petfinder API
var CLIENT_ID = "SpVPhvPRJKYA7CcFQVZYjyKLMAcKeMkJRIpTsBX66izcpBVCDj";
var CLIENT_SECRET = "WXaCjTAqEdnZw3yTBVJaAxAcdUBI9wdkcqefGLOZ";
// cache token so we get a new one after expiration
var cachedToken = null;
var tokenExpiration = 0;
// pbtain the access token from petfinder API using our credentials
function getAccessToken() {
    return __awaiter(this, void 0, void 0, function () {
        var now, response, data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    now = Date.now() / 1000;
                    if (cachedToken && now < tokenExpiration) {
                        console.log("✅ Using cached access token.");
                        return [2 /*return*/, cachedToken];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetch("https://api.petfinder.com/v2/oauth2/token", {
                            method: "POST",
                            headers: { "Content-Type": "application/x-www-form-urlencoded" },
                            body: "grant_type=client_credentials&client_id=".concat(CLIENT_ID, "&client_secret=").concat(CLIENT_SECRET)
                        })];
                case 2:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = _a.sent();
                    cachedToken = data.access_token;
                    tokenExpiration = now + 3600; // have to make sure token isnt expired!!!
                    console.log(" New Access Token:", cachedToken);
                    return [2 /*return*/, cachedToken]; // console log to test that token is being accessed!
                case 4:
                    error_1 = _a.sent();
                    console.error("Error getting access token:", error_1);
                    return [2 /*return*/, null];
                case 5: return [2 /*return*/];
            }
        });
    });
}
// obtain PET INFO from the api
function searchPets() {
    return __awaiter(this, void 0, void 0, function () {
        var accessToken, searchInput, petName, url, params, response, data, error_2;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, getAccessToken()];
                case 1:
                    accessToken = _c.sent();
                    if (!accessToken) {
                        console.error("Failed to get access token!");
                        return [2 /*return*/];
                    }
                    searchInput = document.querySelector(".search-container input");
                    petName = searchInput === null || searchInput === void 0 ? void 0 : searchInput.value.trim();
                    url = "https://api.petfinder.com/v2/animals";
                    params = [];
                    if (petName) {
                        params.push("name=".concat(encodeURIComponent(petName)));
                    }
                    if (params.length > 0) {
                        url += "?" + params.join("&");
                    }
                    console.log("Searching: ", url); //console log to make sure api is searched
                    //filters cats vs dogs
                    if ((_a = document.querySelector("#dog")) === null || _a === void 0 ? void 0 : _a.checked)
                        params.push("type=dog");
                    if ((_b = document.querySelector("#cat")) === null || _b === void 0 ? void 0 : _b.checked)
                        params.push("type=cat");
                    console.log("Fetching data from:", url);
                    _c.label = 2;
                case 2:
                    _c.trys.push([2, 5, , 6]);
                    return [4 /*yield*/, fetch(url, {
                            headers: { "Authorization": "Bearer ".concat(accessToken) }
                        })];
                case 3:
                    response = _c.sent();
                    if (!response.ok) {
                        throw new Error("HTTP error: ".concat(response.status));
                    }
                    return [4 /*yield*/, response.json()];
                case 4:
                    data = _c.sent();
                    console.log("API Response:", data); //console log to make sure api is responding correctly with json format
                    displayPets(data.animals);
                    return [3 /*break*/, 6];
                case 5:
                    error_2 = _c.sent();
                    console.error("Error fetching pet data:", error_2);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
// create container and DISPLAY the pets
function displayPets(pets) {
    var container = document.querySelector(".pet-listings");
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
    var petsToShow = pets.slice(0, 6);
    petsToShow.forEach(function (pet) {
        var petDiv = document.createElement("div");
        petDiv.classList.add("pet-listing");
        var petImage = "placeholder-pet.jpg"; // put in a default image in case photo doesnt exist?
        if (pet.photos && pet.photos.length > 0) {
            petImage = pet.photos[0].full || pet.photos[0].large || pet.photos[0].medium || pet.photos[0].small || petImage;
        }
        petDiv.innerHTML = "\n            <img src=\"".concat(petImage, "\" alt=\"").concat(pet.name, "\">\n            <h3>").concat(pet.name, "</h3>\n            <p><strong>Breed:</strong> ").concat(pet.breeds.primary || "Unknown", "</p>\n            <p><strong>Age:</strong> ").concat(pet.age, "</p>\n            <p><strong>Size:</strong> ").concat(pet.size, "</p>\n             <button class=\"favorite-button\"><i class=\"far fa-heart\"></i></button>\n        ");
        container === null || container === void 0 ? void 0 : container.appendChild(petDiv);
    });
    document.querySelectorAll(".favorite-button").forEach(function (button) {
        button.addEventListener("click", function (event) {
            var target = event.target;
            var heartIcon = target.querySelector("i");
            if (heartIcon) {
                //makes the heart icon go from empty to filled
                if (heartIcon.classList.contains("fas")) {
                    heartIcon.classList.remove("fas");
                    heartIcon.classList.add("far");
                }
                else {
                    heartIcon.classList.remove("far");
                    heartIcon.classList.add("fas");
                }
            }
        });
    });
    console.log("Pets displaying");
}
// function to reset filters back to all empty so user can pick again
function resetFilters() {
    document.querySelectorAll(".filter-group input").forEach(function (input) {
        input.checked = false;
    });
    var searchInput = document.querySelector(".search-container input");
    if (searchInput) {
        searchInput.value = "";
    }
}
// Makes sure random pets are displayed AS SOON AS PAGE LOADS so the page wont be empty
document.addEventListener("DOMContentLoaded", searchPets);
// allows user to click the heart icon to favorite pets and fills heart red when favorited
document.addEventListener("click", function (event) {
    var target = event.target;
    if (target.classList.contains("fa-heart")) {
        target.classList.toggle("far"); // Toggle hollow heart
        target.classList.toggle("fas"); // Toggle solid heart
        target.classList.toggle("favorited"); // Toggle red color
    }
});
// event listeners
(_a = document.querySelector(".search-container button")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", searchPets);
(_b = document.querySelector(".apply-button")) === null || _b === void 0 ? void 0 : _b.addEventListener("click", searchPets);
(_c = document.querySelector(".reset-button")) === null || _c === void 0 ? void 0 : _c.addEventListener("click", function () {
    resetFilters();
    searchPets();
});
