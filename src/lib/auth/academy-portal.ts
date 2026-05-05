import "server-only";

import { redirect } from "next/navigation";

import {
  getAcademyParentByEmail,
  getAcademyStudentById,
  getAcademyStudentUserByEmail,
  getAcademyTutorByEmail,
} from "@/lib/academy-data";
import { buildAcademyLoginPath, requireAuthenticatedAcademyUser } from "@/lib/auth/academy-access";

export async function requireAcademyParentUser() {
  const user = await requireAuthenticatedAcademyUser("/parent");
  const parent = await getAcademyParentByEmail(user.email ?? "");

  if (!parent) {
    redirect(
      buildAcademyLoginPath("This account does not have parent portal access.", "/parent"),
    );
  }

  return {
    user,
    parent,
  };
}

export async function requireAcademyTutorUser() {
  const user = await requireAuthenticatedAcademyUser("/tutor");
  const tutor = await getAcademyTutorByEmail(user.email ?? "");

  if (!tutor) {
    redirect(buildAcademyLoginPath("This account does not have tutor portal access.", "/tutor"));
  }

  return {
    user,
    tutor,
  };
}

export async function requireAcademyStudentUser() {
  const user = await requireAuthenticatedAcademyUser("/student");
  const studentUser = await getAcademyStudentUserByEmail(user.email ?? "");

  if (!studentUser) {
    redirect(
      buildAcademyLoginPath("This account does not have student portal access.", "/student"),
    );
  }

  const student = await getAcademyStudentById(studentUser.student_id);

  if (!student) {
    redirect(
      buildAcademyLoginPath(
        "The linked student record could not be found. Update the student portal access entry and try again.",
        "/student",
      ),
    );
  }

  return {
    user,
    student,
    studentUser,
  };
}
