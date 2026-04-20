"use server";

import { ACADEMY_TESTIMONIAL_BUCKET } from "@/content/academy-content";
import { sanitizeFileName } from "@/lib/input-security";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

type CreateUploadUrlInput = {
  fileName: string;
  contentType: string;
  fileSize: number;
};

type CreateUploadUrlResult =
  | {
      status: "success";
      path: string;
      token: string;
    }
  | {
      status: "error";
      message: string;
    };

const MAX_VIDEO_SIZE_BYTES = 250 * 1024 * 1024;
const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

export async function createTestimonialUploadUrl(
  input: CreateUploadUrlInput,
): Promise<CreateUploadUrlResult> {
  if (!ALLOWED_VIDEO_TYPES.has(input.contentType)) {
    return {
      status: "error",
      message: "Upload an MP4, WebM, or QuickTime video.",
    };
  }

  if (input.fileSize <= 0 || input.fileSize > MAX_VIDEO_SIZE_BYTES) {
    return {
      status: "error",
      message: "Video files must be smaller than 250 MB.",
    };
  }

  try {
    const supabase = getSupabaseAdminClient();
    const safeName = sanitizeFileName(input.fileName || "testimonial-video");
    const storagePath = `submissions/${crypto.randomUUID()}-${safeName}`;
    const { data, error } = await supabase.storage
      .from(ACADEMY_TESTIMONIAL_BUCKET)
      .createSignedUploadUrl(storagePath);

    if (error || !data) {
      throw error ?? new Error("Unable to create a signed upload URL.");
    }

    return {
      status: "success",
      path: data.path,
      token: data.token,
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Unable to prepare the testimonial video upload right now.",
    };
  }
}
