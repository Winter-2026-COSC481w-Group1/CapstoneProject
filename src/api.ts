const VITE_API_URL = import.meta.env.VITE_API_URL;



export async function post(path: string, data: FormData | object, token: string) {
  //set default header
  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
  };
  
  let sendData;
  //check input type
  if (!(data instanceof FormData))
  {
     headers['Content-Type'] = 'application/json';
     sendData = JSON.stringify(data)
  }
  else
  {
    sendData = data;
  }

  const response = await fetch(`${VITE_API_URL}/${path}`, {
    method: 'POST',
    body: sendData,
    headers: headers,
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail);
  }
  return response.json();
}

export async function get(path: string, token: string) {
  const response = await fetch(`${VITE_API_URL}/${path}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail);
  }
  return response.json();
}

export async function del(path: string, token: string) {
  const response = await fetch(`${VITE_API_URL}/${path}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail);
  }
  return response.json();
}
