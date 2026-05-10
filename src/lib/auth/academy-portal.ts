import "server-only";

import { redirect } from "next/navigation";

import {
  getAcademyParentById,
  getAcademyStudentById,
  getAcademyTutorById,
} from "@/lib/academy-data";
import {
  buildAcademyLoginPath,
  resolveAcademyAccessOptionsByEmail,
  requireAuthenticatedAcademyUser,
} from "@/lib/auth/academy-access";

export async function requireAcademyParentUser() {
  const user = await requireAuthenticatedAcademyUser("/parent");
  const accesses = await resolveAcademyAccessOptionsByEmail(user.email);
  const parentAccess = accesses.find((access) => access.role === "parent");
  const parent = parentAccess ? await getAcademyParentById(parentAccess.parentId) : null;

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
  const accesses = await resolveAcademyAccessOptionsByEmail(user.email);
  const tutorAccess = accesses.find((access) => access.role === "tutor");
  const tutor = tutorAccess ? await getAcademyTutorById(tutorAccess.tutorId) : null;

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
  const accesses = await resolveAcademyAccessOptionsByEmail(user.email);
  const studentAccess = accesses.find((access) => access.role === "student");

  if (!studentAccess) {
    redirect(
      buildAcademyLoginPath("This account does not have student portal access.", "/student"),
    );
  }

  const student = await getAcademyStudentById(studentAccess.studentId);

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
    access: studentAccess,
  };
}
