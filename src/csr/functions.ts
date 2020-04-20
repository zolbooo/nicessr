export const functionInvoker = (functionName: string) => (data: any) =>
  fetch(`${document.location.pathname}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ functionName, data }),
  })
    .then((res) => res.json())
    .then((res) => {
      if (res.status !== 'success') throw Error(res.data);
      return res.data;
    });
