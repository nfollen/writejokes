import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';
  
  // Use env var for proper redirect (handles Replit proxy correctly)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://writejokes.replit.app';

  if (code) {
    const supabase = createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      return NextResponse.redirect(`${baseUrl}${next}`);
    }
  }

  // Return to login page with error
  return NextResponse.redirect(`${baseUrl}/login?error=auth_callback_error`);
}
