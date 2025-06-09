'use client';
import useSWR from 'swr';
import useSWRMutation, { SWRMutationResponse } from 'swr/mutation';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fetcher = async <T = any>(...args: [input: RequestInfo | URL, init?: RequestInit]) => {
  const [url, options] = args;
  const responseData = async (res: Response) => {
    return (await res.json()) as T;
  };
  return fetch(url, options).then((res) => {
    return responseData(res);
  });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useFetch = <T = any>(...args: [input: RequestInfo | URL, init?: RequestInit]) => {
  const [url, options] = args;
  return useSWR([url, options], ([url, options]) => fetcher<T>(url, options));
};

export const useFetchTrig = (
  ...args: [input: RequestInfo | URL, init?: RequestInit]
): SWRMutationResponse => {
  const [url, options] = args;
  return useSWRMutation([url, options], ([url, options]) => fetcher(url, options));
};
