import { randomUUID } from 'crypto';

import { NextResponse } from 'next/server';

import { requireAuth } from '@/lib/auth/api-auth';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_BYTES = 5 * 1024 * 1024;

function extensionForMime(mime: string) {
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'bin';
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if ('error' in auth) return auth.error;

  const { user, supabase } = auth;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const photo = formData.get('photo');
  if (!(photo instanceof File) || photo.size === 0) {
    return NextResponse.json({ error: 'Photo file is required' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(photo.type)) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
  }

  if (photo.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large (max 5 MB)' }, { status: 400 });
  }

  const path = `${user.id}/${randomUUID()}.${extensionForMime(photo.type)}`;
  const buffer = Buffer.from(await photo.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from('civic-photos')
    .upload(path, buffer, { contentType: photo.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data } = supabase.storage.from('civic-photos').getPublicUrl(path);

  return NextResponse.json({ url: data.publicUrl });
}
