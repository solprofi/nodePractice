const app = {};

app.config = {
  sessionToken: false,
};

// AJAX client
app.client = {};

// interface for making API calls
app.client.request = (headers, path, method, queryObject, payload, callback) => {
  headers = typeof (headers) === 'object' && headers !== null ? headers : {};
  path = typeof (path) === 'string' ? path : '/';
  method = typeof (method) === 'string' && ['GET', 'POST', 'PUT', 'DELETE'].includes(method) ? method : 'GET';
  queryObject = typeof (queryObject) === 'object' && queryObject !== null ? queryObject : {};
  payload = typeof (payload) === 'object' && payload !== null ? payload : {};
  callback = typeof (callback) === 'function' ? callback : false;

  let requestUrl = `${path}?`;
  let keysCount = 0;

  Object.keys(queryObject).forEach((key) => {
    keysCount++;

    if (keysCount > 1) {
      requestUrl += '&';
    }
    requestUrl += `${key}=${queryObject[key]}`;
  });

  // form the request
  const xhr = new XMLHttpRequest();
  xhr.open(method, requestUrl, true);
  xhr.setRequestHeader('Content-Type', 'application/json');

  // add all the headers to the request
  Object.keys(headers).forEach((key) => {
    xhr.setRequestHeader(key, headers[key]);
  });

  if (app.config.sessionToken) {
    xhr.setRequestHeader('token', app.config.sessionToken.id);
  }

  // handle the response when it comes back
  xhr.onreadystatechange = () => {
    if (xhr.readyState === XMLHttpRequest.DONE) {
      const { status, responseText } = xhr;

      if (callback) {
        try {
          const parsedResponse = JSON.parse(responseText);
          callback(status, parsedResponse);
        } catch (e) {
          callback(status, false);
        }
      }
    }
  };

  // send the payload
  const payloadString = JSON.stringify(payload);
  xhr.send(payloadString);
};
