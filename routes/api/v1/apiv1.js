import express from 'express';
import fetch from 'node-fetch';
import { parse } from 'node-html-parser';
var router = express.Router();

router.get('/previewurl', function(req, res, next) {
  const url = req.query.url;
  const SELECTED_META_TAGS = new Set(["og:url", "og:title", "og:image", "og:description"])
  fetch(url)
    .then(resp => resp.text())
    .then(respText => {
      const parsedHtml = parse(respText);
      const metaTags = parsedHtml.querySelectorAll('meta').map(tag => tag.attributes);
      const filteredMetaTags  = metaTags.filter(tag => SELECTED_META_TAGS.has(tag.property));
      const metaTagsObj = filteredMetaTags.
        reduce((obj, item) => (obj[item.property] = item.content, obj) ,{});
      const previewHtmlObj = getPreviewHtmlObj(metaTagsObj, parsedHtml, url);
      res.send(parsedHtml.toString());
    })
    .catch(e => res.send(e));
});

const getPreviewHtmlObj = (metaTagsObj, parsedHtml, url) => {
  let previewHtmlObj = getEmptyPreviewHtmlObj();
  previewHtmlObj["url"] = metaTagsObj["og:url"] ? metaTagsObj["og:url"] : url;
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
