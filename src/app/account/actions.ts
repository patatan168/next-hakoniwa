'use server';

export async function getPasskeys() {
  const res = await fetch('/api/auth/passkey/list', {
    headers: { Cookie: '...' },
  });
  return res.json();
}
