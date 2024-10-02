'use client';
import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';

export const fetcher = async (...args: [input: RequestInfo | URL, init?: RequestInit]) => {
  const [url, options] = args;
  const isGetter = options?.method === 'GET';
  const responseData = async (res: Response) => {
    return isGetter ? await res.json() : await res.text();
  };
  return fetch(url, options).then((res) => {
    return responseData(res);
  });
};

export const useFetch = (...args: [input: RequestInfo | URL, init?: RequestInit]) => {
  const [url, options] = args;
  return useSWR([url, options], ([url, options]) => fetcher(url, options));
};

export const useFetchTrig = (...args: [input: RequestInfo | URL, init?: RequestInit]) => {
  const [url, options] = args;
  return useSWRMutation([url, options], ([url, options]) => fetcher(url, options));
};
