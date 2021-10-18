
function previewUrl(){
    let url = document.getElementById("urlInput").value;

    getURLPreview(url);
}

function displayPreviews(previewHTML){
    document.getElementById("url_previews").innerHTML = previewHTML;
}
