// this function should call your URL preview api endpoint
// it should then call the displayPreviews() function and pass it
// the html that was returned from the api endpoint.
// if there was an error, call the displayPreviews() function with
// an error message and info from the error.
function getURLPreview(url){
    const endpoint = "api/v1/previewurl";
    fetch(endpoint + "?url=" + url)
      .then(resp => resp.text())
      .then(previewHtml => {
        displayPreviews(previewHtml);
      })
      .catch(e => displayPreviews(e.toString()))
}
