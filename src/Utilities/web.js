export const get = async function(url) {
  return fetch(url, buildOptions('GET'));
}

export const post = async function(url, body) {
  return fetch(url, buildOptions('POST', body));
}

export const put = async function(url, body) {
  return fetch(url, buildOptions('PUT', body));
}

export const remove = async function(url) {
  return fetch(url, buildOptions('DELETE'));
}

const buildOptions = function(method, body) {
  const headers = {
    'Content-Type': 'application/json'
  };

  const options = {
    method: method,
    headers: headers
  };

  if (method !== 'GET' && body !== undefined) {
    options.body = JSON.stringify(body);
  }

  return options;
}