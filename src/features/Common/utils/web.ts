const buildOptions = (method: 'GET' | 'POST' | 'PUT' | 'DELETE', body?: unknown) => {
  const headers = {
    'Content-Type': 'application/json'
  };

  const options: { method: string; headers: Record<string, string>; body?: string } = {
    method: method,
    headers: headers
  };

  if (method !== 'GET' && body !== undefined) {
    options.body = JSON.stringify(body);
  }

  return options;
};

export const get = async (url: string): Promise<Response> => {
  return fetch(url, buildOptions('GET'));
};

export const post = async (url: string, body: unknown): Promise<Response> => {
  return fetch(url, buildOptions('POST', body));
};

export const put = async (url: string, body: unknown): Promise<Response> => {
  return fetch(url, buildOptions('PUT', body));
};

export const remove = async (url: string): Promise<Response> => {
  return fetch(url, buildOptions('DELETE'));
};
