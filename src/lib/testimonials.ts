import { getSupabaseClient } from "@/lib/supabase";

export type AcademyTestimonial = {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  class_year: string;
  tutor_name: string;
  subject: string;
  impression: string | null;
  video_path: string | null;
  video_url: string | null;
  is_published: boolean;
};

export async function listAcademyTestimonials() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("academy_testimonials")
    .select(
      "id, created_at, first_name, last_name, class_year, tutor_name, subject, impression, video_path, video_url, is_published",
    )
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as AcademyTestimonial[];
}
