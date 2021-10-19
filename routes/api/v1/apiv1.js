import express from 'express';
import fetch from 'node-fetch';
import { parse } from 'node-html-parser';
var router = express.Router();

router.get('/previewurl', function(req, res, next) {
  const url = req.query.url;
  if (url === "http://localhost:3000/") {
    const previewHtmlObj = {
      "url": url,
      "title": "Brandon Ta",
    }
    res.send(getPreviewHtml(previewHtmlObj));
    return;
  }
  const SELECTED_META_TAGS = new Set(["og:url", "og:title", "og:image", "og:description"])
  fetch(url)
    .then(resp => resp.text())
    .then(respText => {
      const parsedHtml = parse(respText);
      const metaTags = parsedHtml.querySelectorAll('meta').map(tag => tag.attributes);
      const filteredMetaTags  = metaTags.filter(tag => SELECTED_META_TAGS.has(tag.property));
      const metaTagsObj = filteredMetaTags.reduce((obj, item) => (obj[item.property] = item.content, obj), {});   // Convert array of elements to an object
      console.dir(metaTagsObj);
      const previewHtmlObj = getPreviewHtmlObj(metaTagsObj, parsedHtml, url);
      res.send(getPreviewHtml(previewHtmlObj));
    })
    .catch(e => res.send(e));
});

const getPreviewHtmlObj = (metaTagsObj, parsedHtml, url) => {
  let previewHtmlObj = getEmptyPreviewHtmlObj();
  previewHtmlObj["url"] = metaTagsObj["og:url"] ? metaTagsObj["og:url"] : url;
  previewHtmlObj["title"] = metaTagsObj["og:title"] ? metaTagsObj["og:title"] : parsedHtml.querySelectorAll("title")[0].textContent;
  previewHtmlObj["image"] = metaTagsObj["og:image"];
  previewHtmlObj["description"] = metaTagsObj["og:description"];
  if (!previewHtmlObj["title"]) {
    previewHtmlObj["title"] = url;
  }
  return previewHtmlObj;
}

const getPreviewHtml = (previewHtmlObj) => {
  return `
    <div style="max-width: 300px; border: solid 1px; padding: 3px; text-align: center;">
      <a href="${previewHtmlObj["url"]}">
          <p><strong>
            ${previewHtmlObj["title"]}
          </strong></p>
          ${previewHtmlObj["image"] ? `<img src="${previewHtmlObj["image"]}" style="max-height: 200px; max-width: 270px;">` : ""}
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
    "description": undefined
  }
}

export default router;
