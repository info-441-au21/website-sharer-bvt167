function init(){
    let urlInput = document.getElementById("urlInput");
    urlInput.onkeyup = previewUrl;
    urlInput.onchange = previewUrl;
    urlInput.onclick = previewUrl;

    loadIdentity();
    loadPosts();
}

async function loadPosts(){
    let postsJson = await loadPostsApi();
    console.log(postsJson);
    let postsHtml = postsJson.map(postInfo => {
        return `
        <div class="post">
            ${postInfo.description}
            ${postInfo.htmlPreview}
            <div><a href="/userInfo.html?user=${encodeURIComponent(postInfo.username)}">${postInfo.username}</a>, ${postInfo.created_date}</div>
            <div class="post-interactions">
                <div>
                    <span title="${postInfo.likes}"> ${postInfo.likes ? `${postInfo.likes.length}` : 0} likes </span> &nbsp; &nbsp; 
                    <span class="heart-button-span ${myIdentity? "": "d-none"}">
                        ${postInfo.likes && postInfo.likes.includes(myIdentity) ? 
                            `<button class="heart_button" onclick='unlikePost("${postInfo.id}")'>&#x2665;</button>` : 
                            `<button class="heart_button" onclick='likePost("${postInfo.id}")'>&#x2661;</button>`} 
                    </span>
                </div>
                <br>
                <button onclick='toggleComments("${postInfo.id}")'>View/Hide comments</button>
                <div id='comments-box-${postInfo.id}' class="comments-box d-none">
                    <button onclick='refreshComments("${postInfo.id}")')>refresh comments</button>
                    <div id='comments-${postInfo.id}'></div>
                    <div class="new-comment-box ${myIdentity? "": "d-none"}">
                        New Comment:
                        <textarea type="textbox" id="new-comment-${postInfo.id}"></textarea>
                        <button onclick='postComment("${postInfo.id}")'>Post Comment</button>
                    </div>
                </div>
            </div>
        </div>`
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

async function likePost(postId){
    let responesJSON = await likePostAPI(postId);
    if(responesJSON.status == "error"){
        console.log("error:" + responesJSON.error);
    }else{
        loadPosts();
    }
}


async function unlikePost(postId){
    let responesJSON = await unlikePostAPI(postId);
    if(responesJSON.status == "error"){
        console.log("error:" + responesJSON.error);
    }else{
        loadPosts();
    }
}


function getCommentHTML(commentsJSON){
    return commentsJSON.map(commentInfo => {
        return `
        <div class="individual-comment-box">
            <div>${escapeHTML(commentInfo.comment)}</div>
            <div> - <a href="/userInfo.html?user=${encodeURIComponent(commentInfo.username)}">${commentInfo.username}</a>, ${commentInfo.created_date}</div>
        </div>`
    }).join(" ");
}

async function toggleComments(postID){
    let element = document.getElementById(`comments-box-${postID}`);
    if(!element.classList.contains("d-none")){
        element.classList.add("d-none");
    }else{
        element.classList.remove("d-none");
        let commentsElement = document.getElementById(`comments-${postID}`);
        if(commentsElement.innerHTML == ""){ // load comments if not yet loaded
            commentsElement.innerHTML = "loading..."
            commentsJSON = await getCommentsAPI(postID);
            commentsElement.innerHTML = getCommentHTML(commentsJSON);
        }
    }
    
}

async function refreshComments(postID){
    let commentsElement = document.getElementById(`comments-${postID}`);
    commentsElement.innerHTML = "loading..."
    commentsJSON = await getCommentsAPI(postID);
    commentsElement.innerHTML = getCommentHTML(commentsJSON);
}

async function postComment(postID){
    let newComment = document.getElementById(`new-comment-${postID}`).value;
    let responesJSON = await postCommentAPI(postID, newComment);
    if(responesJSON.status == "error"){
        console.log("error:" + responesJSON.error);
    }else{
        refreshComments(postID);
    }
}