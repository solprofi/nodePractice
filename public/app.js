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


// Bind the forms

app.bindForms = function () {
  document.querySelector('form').addEventListener('submit', function (e) {
    // Stop it from submitting

    e.preventDefault();

    const formId = this.id;

    const path = this.action;

    const method = this.method.toUpperCase();


    // Hide the error message (if it's currently shown due to a previous error)

    document.querySelector(`#${formId} .formError`).style.display = 'hidden';


    // Turn the inputs into a payload

    const payload = {};

    const { elements } = this;

    for (let i = 0; i < elements.length; i++) {
      if (elements[i].type !== 'submit') {
        const valueOfElement = elements[i].type == 'checkbox' ? elements[i].checked : elements[i].value;

        payload[elements[i].name] = valueOfElement;
      }
    }


    // Call the API

    app.client.request(undefined, path, method, undefined, payload, (statusCode, responsePayload) => {
      // Display an error on the form if needed

      if (statusCode !== 200) {
        // Try to get the error from the api, or set a default error message

        const error = typeof (responsePayload.Error) === 'string' ? responsePayload.Error : 'An error has occured, please try again';


        // Set the formError field with the error text

        document.querySelector(`#${formId} .formError`).innerHTML = error;


        // Show (unhide) the form error field on the form

        document.querySelector(`#${formId} .formError`).style.display = 'block';
      } else {
        // If successful, send to form response processor

        app.formResponseProcessor(formId, payload, responsePayload);
      }
    });
  });
};


// Form response processor

app.formResponseProcessor = function (formId, requestPayload, responsePayload) {
  const functionToCall = false;

  if (formId == 'accountCreate') {

    // @TODO Do something here now that the account has been created successfully

  }
};


// Init (bootstrapping)

app.init = function () {
  // Bind all form submissions

  app.bindForms();
};


// Call the init processes after the window loads

window.onload = function () {
  app.init();
};
