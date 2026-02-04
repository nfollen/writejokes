'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

let client: ReturnType<typeof createClientComponentClient> | null = null;

export const createClient = () => {
  if (!client) {
    client = createClientComponentClient();
  }
  return client;
};
