const VITE_API_URL = import.meta.env.VITE_API_URL;



export async function post(path: string, data: FormData | object, token: string) {
  const response = await fetch(`${VITE_API_URL}/${path}`, {
    method: 'POST',
    body: data,
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
