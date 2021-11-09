function init(){
    let urlInput = document.getElementById("urlInput");
    urlInput.onkeyup = previewUrl;
    urlInput.onchange = previewUrl;
    urlInput.onclick = previewUrl;

    loadIdentity();

    loadPosts();
}

async function loadIdentity(){
    let identityInfo = await loadIdentityApi();
    let identity_div = document.getElementById("identity_div");
    if(identityInfo.status == "error"){
        identity_div.innerHTML = `<div>
        <button onclick="loadIdentity()">retry</button>
        Error loading identity: <span id="identity_error_span"></span>
        </div>`;
        document.getElementById("identity_error_span").innerText = identityInfo.error;
        document.getElementById("make_post_div").classList.add("d-none");
    } else if(identityInfo.status == "loggedin"){
        identity_div.innerHTML = `
        <a href="#">${identityInfo.userInfo.name} (${identityInfo.userInfo.username})</a>
        <a href="signout" class="btn btn-danger" role="button">Log out</a>`;
        document.getElementById("make_post_div").classList.remove("d-none");
    } else { //loggedout
        identity_div.innerHTML = `
        <a href="signin" class="btn btn-primary" role="button">Log in</a>`;
        document.getElementById("make_post_div").classList.add("d-none");
    }
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
