import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const bucketName = process.env.SUPABASE_STORAGE_BUCKET ?? "jbb1";

// Server-side client with service role (for uploads)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Client-side public client
export const supabasePublic = createClient(
  supabaseUrl,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
);

export async function uploadProductImage(
  file: File | Buffer,
  filename: string
): Promise<string> {
  const path = `products/${Date.now()}_${filename}`;

  const { error } = await supabaseAdmin.storage
    .from(bucketName)
    .upload(path, file, { upsert: true, contentType: "image/jpeg" });

  if (error) {
    throw new Error(`Upload gagal: ${error.message}`);
  }

  const { data } = supabaseAdmin.storage.from(bucketName).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadSelfieImage(
  file: Buffer,
  filename: string
): Promise<string> {
  const path = `selfies/${Date.now()}_${filename}`;

  const { error } = await supabaseAdmin.storage
    .from(bucketName)
    .upload(path, file, { upsert: true, contentType: "image/jpeg" });

  if (error) {
    throw new Error(`Upload selfie gagal: ${error.message}`);
  }

  const { data } = supabaseAdmin.storage.from(bucketName).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteProductImage(url: string): Promise<void> {
  const path = url.split(`/${bucketName}/`)[1];
  if (!path) return;
  await supabaseAdmin.storage.from(bucketName).remove([path]);
}
