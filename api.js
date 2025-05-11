export function callApi(reqmethod, url, data, responseHandler) {
    let options = {
        method: reqmethod,
        headers: { "Content-Type": "application/json" }
    };

    // Only stringify if data is an object (not already a string)
    if (reqmethod !== "GET" && reqmethod !== "DELETE") {
        options.body = typeof data === "string" ? data : JSON.stringify(data);
    }

    return fetch(url, options)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.text();
        })
        .then(data => {
            responseHandler(data);
            return data;
        })
        .catch(error => {
            console.error("API Error:", error);
            alert(error);
            throw error;
        });
}




export function setSession(sesname, sesvalue, expday) {
    let D = new Date();
    D.setTime(D.getTime() + expday * 24 * 60 * 60 * 1000);
    document.cookie = `${sesname}=${sesvalue}; expires=${D.toUTCString()}; path=/; secure; SameSite=Strict`;
    
    return sesvalue; // ✅ Returning session value for debugging
}

export function getSession(sesname) {
    let decodedCookie = decodeURIComponent(document.cookie);
    let cookieData = decodedCookie.split('; '); // ✅ Fixed space handling
    for (let c of cookieData) {
        if (c.startsWith(sesname + "=")) {
            return c.substring(sesname.length + 1);
        }
    }
    return "";
}
