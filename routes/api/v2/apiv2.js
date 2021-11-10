import express from 'express';
import fetch from 'node-fetch';
import mongoose from 'mongoose';
import { parse } from 'node-html-parser';

var router = express.Router();

let Post;
const SELECTED_META_TAGS = new Set(["og:url", "og:title", "og:image", "og:description",
                                    "og:site_name"]);

main().catch(err => console.log(err));

async function main() {
  const localURI = 'mongodb://localhost:27017/a3';
  const onlineURI = 'mongodb+srv://bvt:Password123@info-441.ctuvu.mongodb.net/info-441?retryWrites=true&w=majority'

  await mongoose.connect(onlineURI);

  const postSchema = new mongoose.Schema({
    url: String,
    username: String,
    description: String,
    created_at: Date,
  });

  Post = mongoose.model("Post", postSchema);
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
    const newPost = Post({ url: post.url, username: post.username, description: post.description,
                           created_at: new Date() });
    await newPost.save();
  } catch(e) {
    resp.status = "error";
    resp.error = e.message;
    res.status("500");
  };
  resp.status = "failure";
  res.json(resp);
});

router.get('/posts', async function(req, res, next) {
  try {
    const allPosts = await Post.find();
    const responsePosts =
      await Promise.all(allPosts.map(async (post) => await getResponsePostFromPost(post)));
    res.json(responsePosts);
  } catch(e) {
    res.status("500").json({ error: e.message });
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
