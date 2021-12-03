import express from 'express';
import fetch from 'node-fetch';
import mongoose from 'mongoose';
import { parse } from 'node-html-parser';

var router = express.Router();

let Post;
let Comment;
let UserInfo;

const SELECTED_META_TAGS = new Set(["og:url", "og:title", "og:image", "og:description",
                                    "og:site_name"]);

main().catch(err => console.log(err));

async function main() {
  const localURI = 'mongodb://localhost:27017/a3';
  const onlineURI = 'mongodb+srv://bvt:Password123@info-441.ctuvu.mongodb.net/info-441?retryWrites=true&w=majority'

  await mongoose.connect(onlineURI);

  const postSchema = new mongoose.Schema({
    url: String,
    description: String,
    username: String,
    likes: [String],
    created_date: Date,
  });
  Post = mongoose.model("Post", postSchema);

  const commentSchema = new mongoose.Schema({
    username: String,
    comment: String,
    post: mongoose.ObjectId,
    created_date: Date,
  });
  Comment = mongoose.model("Comment", commentSchema);

  const userInfoSchema = new mongoose.Schema({
    username: String,
    favoriteIceCream: String
  });
  UserInfo = mongoose.model("UserInfo", userInfoSchema);
}

router.get('/getIdentity', (req, res) => {
  const session = req.session;
  let resp = {};
  if (session.isAuthenticated) {
    resp.status = "loggedin";
    const userInfo = {
      name: session.account.name,
      username: session.account.username
    }
    resp.userInfo = userInfo;
  } else {
    resp.status = "loggedout";
    res.status(401);
  }
  res.json(resp);
});

router.post('/posts', async function(req, res, next) {
  if (!req.session.isAuthenticated) {
    const resp = {
      status: "error",
      error: "not logged in"
    }
    res.status(401).json(resp);
    return;
  }
  const post = req.body;
  let resp = { status: "success" };
  try {
    const newPost = Post({
      url: post.url,
      description: post.description,
      username: req.session.account.username,
      likes: post.likes,
      created_date: new Date()
    });
    await newPost.save();
  } catch(e) {
    resp.status = "error";
    resp.error = e.message;
    res.status("500");
  };
  resp.status = "failure";
  res.json(resp);
});

router.delete('/posts', async function(req, res, next) {
  const session = req.session;
  if (!session.isAuthenticated) {
    res.status(400).json({status: "error", error: "not logged in"});
    return;
  }

  try {
    const postID = req.body.postID;
    const post = await Post.findById(postID);
    console.log(req.body);
    if (session.account.username !== post.username) {
      res.status(401).json({status: "error", error: "you can only delete your own posts"});
      return;
    }
    await Comment.deleteMany({post: postID});
    await Post.findByIdAndDelete(postID);
    res.json({status: "success"});
  } catch(e) {
    res.status("500").json({ error: e.message });
  }
});

router.get('/posts', async function(req, res, next) {
  try {
    res.json(await getPosts(req.query.username));
  } catch(e) {
    res.status("500").json({ error: e.message });
  }
});

router.get('/userPosts', async function(req, res, next) {
  try {
    res.json(await getPosts(req.query.username));
  } catch(e) {
    res.status("500").json({ error: e.message });
  }
});

router.post('/likePost', async function(req, res, next) {
  const session = req.session;
  if (!session.isAuthenticated) {
    res.status(400).json({status: "error", error: "not logged in"});
    return;
  }

  try {
    const post = await Post.findById(req.body.postID);
    if (!post.likes.includes(session.account.username)) {
      post.likes.push(session.account.username);
    }
    await post.save();
    res.json({status: "success"});
  } catch(e) {
    console.log(e);
    res.status(500).json({status: "error", error: e.message});
  }
});

router.post('/unlikePost', async function(req, res, next) {
  const session = req.session;
  if (!session.isAuthenticated) {
    res.status(400).json({status: "error", error: "not logged in"});
    return;
  }

  try {
    const post = await Post.findById(req.body.postID);
    console.log(post);
    post.likes = post.likes.filter(username => username !== session.account.username);
    await post.save();
    res.json({status: "success"});
  } catch(e) {
    console.log(e);
    res.status(500).json({status: "error", error: e.message});
  }
});

router.get('/comments', async function(req, res, next) {
  try {
    const comments = await Comment.find({post: req.query.postID});
    res.json(comments);
  } catch(e) {
    console.log(e);
    res.status(500).json({status: "error", error: e.message});
  }
});

router.post('/comments', async function(req, res, next) {
  const session = req.session;
  if (!session.isAuthenticated) {
    res.status(400).json({status: "error", error: "not logged in"});
    return;
  }

  try {
    const newComment = Comment({
      username: session.account.username,
      comment: req.body.newComment,
      post: req.body.postID,
      created_date: new Date()
    });
    await newComment.save();
    res.json({status: "success"});
  } catch {
    console.log(e);
    res.status(500).json({status: "error", error: e.message});
  }
});

router.get('/previewurl', async function(req, res, next) {
  const url = req.query.url;
  if (url === "http://localhost:3000/") {
    const previewHtmlObj = {
      "url": url,
      "title": "Brandon Ta",
    }
    res.send(getPreviewHtml(previewHtmlObj));
    return;
  }

  try {
    const htmlPreview = await getHtmlPreviewFromUrl(url);
    res.send(htmlPreview);
  } catch(e) {
    res.status("500").send(e.message);
  }
});

router.get('/userInfo', async function(req, res, next) {
  const session = req.session;
  if (!session.isAuthenticated) {
    res.status(400).json({status: "error", error: "not logged in"});
    return;
  }

  try {
    const userInfo = await UserInfo.findOne({username: session.account.username});
    res.json(userInfo);
  } catch(e) {
    console.log(e);
    res.status(500).json({status: "error", error: e.message});
  }
});

router.post('/userInfo', async function(req, res, next) {
  const session = req.session;
  if (!session.isAuthenticated) {
    res.status(400).json({status: "error", error: "not logged in"});
    return;
  }

  try {
    let userInfo = await UserInfo.findOne({username: session.account.username});
    if (userInfo) {
      userInfo.favoriteIceCream = req.body.favoriteIceCream;
    } else {
      userInfo = UserInfo({
        username: session.account.username,
        favoriteIceCream: req.body.favoriteIceCream
      });
    }
    await userInfo.save();
    res.json({status: "success"});
  } catch(e) {
    console.log(e);
    res.status(500).json({status: "error", error: e.message});
  }
});

const getPosts = async (username) => {
  let posts;
  if (username) {
    posts = await Post.find({username: username});
  } else {
    posts = await Post.find();
  }
  let responsePosts = JSON.parse(JSON.stringify(posts));
  for (let post of responsePosts) {
    post.id = post._id;
    post.htmlPreview = await getHtmlPreviewFromUrl(post.url);
  }
  return responsePosts;
}

const getResponsePostFromPost = async (post) => {
  let respPost = {};
  const previewHtml = await getHtmlPreviewFromUrl(post.url);
  respPost.description = post.description;
  respPost.username = post.username;
  respPost.htmlPreview = previewHtml;
  return respPost;

}

const getHtmlPreviewFromUrl = async (url) => {
  const resp = await fetch(url);
  const respText = await resp.text();
  const parsedHtml = parse(respText);
  const metaTags = parsedHtml.querySelectorAll('meta').map(tag => tag.attributes);
  const filteredMetaTags  = metaTags.filter(tag => SELECTED_META_TAGS.has(tag.property));
  const metaTagsObj = filteredMetaTags.reduce((obj, item) =>
    (obj[item.property] = item.content, obj), {});   // Convert array of elements to an object
  const previewHtmlObj = getPreviewHtmlObj(metaTagsObj, parsedHtml, url);
  return getPreviewHtml(previewHtmlObj);
}

const getPreviewHtmlObj = (metaTagsObj, parsedHtml, url) => {
  let previewHtmlObj = getEmptyPreviewHtmlObj();
  previewHtmlObj["url"] = metaTagsObj["og:url"] ? metaTagsObj["og:url"] : url;
  previewHtmlObj["title"] = metaTagsObj["og:title"] ? metaTagsObj["og:title"] : parsedHtml.querySelectorAll("title")[0].textContent;
  previewHtmlObj["image"] = metaTagsObj["og:image"];
  previewHtmlObj["description"] = metaTagsObj["og:description"];
  previewHtmlObj["site_name"] = metaTagsObj["og:site_name"];
  if (!previewHtmlObj["title"]) {
    previewHtmlObj["title"] = url;
  }
  for (let element in previewHtmlObj) {
    if (previewHtmlObj[element]) {
      previewHtmlObj[element] = escapeHTML(previewHtmlObj[element]);
    }
  }
  return previewHtmlObj;
}

const getPreviewHtml = (previewHtmlObj) => {
  return `
    <div style="max-width: 12rem; border: solid 0.2rem; padding: 1rem; margin: 1rem; text-align: center;">
      <a href="${previewHtmlObj["url"]}">
          ${previewHtmlObj["site_name"] ? `<p>${previewHtmlObj["site_name"]}</p>` : ""}
          <p><strong>
            ${previewHtmlObj["title"]}
          </strong></p>
          ${previewHtmlObj["image"] ? `<img src="${previewHtmlObj["image"]}" style="max-height: 10rem; max-width: 10rem;">` : ""}
      </a>
      ${previewHtmlObj["description"] ? `<p>${previewHtmlObj["description"]}</p>` : ""}
    </div>
  `;
}

const getEmptyPreviewHtmlObj = () => {
  return {
    "url": undefined,
    "title": undefined,
    "image": undefined,
    "description": undefined,
    "site_name": undefined,
  }
}

const escapeHTML = str => str.replace(/[&<>'"]/g,
  tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag]));

export default router;
