'use client';
import useSWR from 'swr';
import useSWRMutation, { SWRMutationResponse } from 'swr/mutation';

class ApiError extends Error {
  status: number;
  statusText: string;

  constructor(message: string, status: number, statusText: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fetcher = async <T = any>(...args: [input: RequestInfo | URL, init?: RequestInit]) => {
  const [url, options] = args;
  const responseData = async (res: Response) => {
    const data = (await res.json()) as T;
    if (!res.ok) {
      const errorMessage = (data as { error?: string }).error ?? '';
      const error = new ApiError(errorMessage, res.status, res.statusText);
      throw error;
    }
    return data;
  };
  return fetch(url, options).then((res) => {
    return responseData(res);
  });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useFetch = <T = any>(...args: [input: RequestInfo | URL, init?: RequestInit]) => {
  const [url, options] = args;
  return useSWR<T, ApiError>([url, options], () => fetcher<T>(url, options));
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useFetchTrig = <T = any>(
  ...args: [input: RequestInfo | URL, init?: RequestInit]
): SWRMutationResponse => {
  const [url, options] = args;
  return useSWRMutation<T, ApiError>([url, options], () => fetcher<T>(url, options));
};
