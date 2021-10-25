function init(){
    let urlInput = document.getElementById("urlInput");
    urlInput.onkeyup = previewUrl;
    urlInput.onchange = previewUrl;
    urlInput.onclick = previewUrl;
    loadPosts();
}


async function loadPosts(){
    let postsJson = await loadPostsApi();
    let postsHtml = postsJson.map(postInfo => {
        return `<div class="post">${postInfo.description}${postInfo.htmlPreview}</div>`
    }).join("\n");
    document.getElementById("posts_box").innerHTML = postsHtml;
}

async function postUrl(){
    document.getElementById("postStatus").innerHTML = "sending data..."
    let url = document.getElementById("urlInput").value;
    let description = document.getElementById("descriptionInput").value;
    let status = await postUrlApi(url, description);

    if(status.status == "error"){
        document.getElementById("postStatus").innerText = "Error:" + status.error;
    } else {
        document.getElementById("urlInput").value = "";
        document.getElementById("descriptionInput").value = "";
        document.getElementById("url_previews").innerHTML = "";
        document.getElementById("postStatus").innerHTML = "successfully uploaded"
        loadPosts();
    }
}


let lastURLPreviewed = "";
async function previewUrl(){
    document.getElementById("postStatus").innerHTML = "";
    let url = document.getElementById("urlInput").value;
    if(url != lastURLPreviewed){
        lastURLPreviewed = url;
        document.getElementById("url_previews").innerHTML = "Loading preview..."
        let previewHtml = await getURLPreview(url);
        if(url == lastURLPreviewed){
            document.getElementById("url_previews").innerHTML = previewHtml;
        }
    }
}
