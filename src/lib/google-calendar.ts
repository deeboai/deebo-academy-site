import "server-only";

import type {
  AcademyParentRecord,
  AcademySessionRecord,
  AcademyStudentRecord,
  AcademyTutorRecord,
} from "@/lib/academy-data";
import { assertGoogleCalendarAutomationEnv, env } from "@/lib/env";

type SyncAcademyGoogleCalendarEventInput = {
  session: AcademySessionRecord;
  parent: AcademyParentRecord;
  student: AcademyStudentRecord;
  tutor: AcademyTutorRecord | null;
};

type GoogleCalendarEventResponse = {
  id?: string;
  hangoutLink?: string;
  conferenceData?: {
    entryPoints?: Array<{
      entryPointType?: string;
      uri?: string;
    }>;
  };
};

export type AcademyCalendarSyncResult = {
  eventId: string;
  meetingUrl: string | null;
  createdConferenceLink: boolean;
};

function isOnlineSessionFormat(format: string) {
  const normalizedFormat = format.trim().toLowerCase();
  return normalizedFormat.includes("online") || normalizedFormat.includes("virtual") || normalizedFormat.includes("remote");
}

function buildGoogleCalendarTokenBody() {
  const body = new URLSearchParams();
  body.set("client_id", env.googleClientId);
  body.set("client_secret", env.googleClientSecret);
  body.set("refresh_token", env.googleRefreshToken);
  body.set("grant_type", "refresh_token");
  return body.toString();
}

async function getGoogleCalendarAccessToken() {
  assertGoogleCalendarAutomationEnv();

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: buildGoogleCalendarTokenBody(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Google token exchange failed with status ${response.status}.`);
  }

  const data = (await response.json()) as { access_token?: string };

  if (!data.access_token) {
    throw new Error("Google token exchange did not return an access token.");
  }

  return data.access_token;
}

function buildAcademyCalendarSummary(input: SyncAcademyGoogleCalendarEventInput) {
  const studentName = `${input.student.first_name}${input.student.last_name ? ` ${input.student.last_name}` : ""}`;
  return `Deebo Academy: ${input.session.subject} with ${studentName}`;
}

function buildAcademyCalendarDescription(input: SyncAcademyGoogleCalendarEventInput) {
  const studentName = `${input.student.first_name}${input.student.last_name ? ` ${input.student.last_name}` : ""}`;
  const descriptionLines = [
    "Deebo Academy scheduled session",
    `Student: ${studentName}`,
    `Parent: ${input.parent.full_name}`,
    `Subject: ${input.session.subject}`,
    `Course: ${input.session.course_name || "Not specified"}`,
    `Tutor: ${input.tutor?.full_name || "Not assigned"}`,
    `Session status: ${input.session.status}`,
  ];

  if (input.session.location) {
    descriptionLines.push(`Location: ${input.session.location}`);
  }

  if (input.session.meeting_url) {
    descriptionLines.push(`Meeting link: ${input.session.meeting_url}`);
  }

  // The event description mirrors the Academy business record so calendar guests can reconcile the external invite.
  return descriptionLines.join("\n");
}

function buildAcademyCalendarAttendees(input: SyncAcademyGoogleCalendarEventInput) {
  const attendees = [
    input.parent.email ? { email: input.parent.email, displayName: input.parent.full_name } : null,
    input.tutor?.email ? { email: input.tutor.email, displayName: input.tutor.full_name } : null,
  ].filter((attendee): attendee is { email: string; displayName: string } => Boolean(attendee));

  const dedupedByEmail = new Map<string, { email: string; displayName: string }>();

  for (const attendee of attendees) {
    dedupedByEmail.set(attendee.email.toLowerCase(), attendee);
  }

  return Array.from(dedupedByEmail.values());
}

function buildConferenceRequest(session: AcademySessionRecord) {
  if (!isOnlineSessionFormat(session.format) || session.meeting_url) {
    return null;
  }

  return {
    createRequest: {
      requestId: `${session.id}-${session.updated_at}`,
      conferenceSolutionKey: {
        type: "hangoutsMeet",
      },
    },
  };
}

function buildAcademyCalendarPayload(input: SyncAcademyGoogleCalendarEventInput) {
  const conferenceData = buildConferenceRequest(input.session);

  return {
    summary: buildAcademyCalendarSummary(input),
    description: buildAcademyCalendarDescription(input),
    start: {
      dateTime: input.session.starts_at,
    },
    end: {
      dateTime: input.session.ends_at,
    },
    location: input.session.location || undefined,
    attendees: buildAcademyCalendarAttendees(input),
    status: input.session.status === "cancelled" ? "cancelled" : "confirmed",
    conferenceData: conferenceData ?? undefined,
  };
}

function getGoogleCalendarMeetingUrl(event: GoogleCalendarEventResponse) {
  if (event.hangoutLink) {
    return event.hangoutLink;
  }

  return (
    event.conferenceData?.entryPoints?.find((entryPoint) => entryPoint.entryPointType === "video")?.uri ?? null
  );
}

export async function syncAcademyGoogleCalendarEvent(input: SyncAcademyGoogleCalendarEventInput) {
  const accessToken = await getGoogleCalendarAccessToken();
  const calendarEventPayload = buildAcademyCalendarPayload(input);
  const hasExistingCalendarEvent = Boolean(input.session.google_calendar_event_id);

  if (input.session.status === "cancelled" && !hasExistingCalendarEvent) {
    throw new Error("Cannot cancel a Google Calendar event because no external event ID exists yet.");
  }

  const endpoint = hasExistingCalendarEvent
    ? `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(env.googleCalendarId)}/events/${encodeURIComponent(input.session.google_calendar_event_id ?? "")}?conferenceDataVersion=1&sendUpdates=all`
    : `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(env.googleCalendarId)}/events?conferenceDataVersion=1&sendUpdates=all`;

  const response = await fetch(endpoint, {
    method: hasExistingCalendarEvent ? "PATCH" : "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(calendarEventPayload),
    cache: "no-store",
  });

  if (!response.ok) {
    const responseBody = await response.text();
    throw new Error(`Google Calendar sync failed with status ${response.status}: ${responseBody}`);
  }

  const event = (await response.json()) as GoogleCalendarEventResponse;
  const generatedMeetingUrl = getGoogleCalendarMeetingUrl(event);

  if (!event.id) {
    throw new Error("Google Calendar sync succeeded but did not return an event ID.");
  }

  return {
    eventId: event.id,
    meetingUrl: input.session.meeting_url || generatedMeetingUrl,
    createdConferenceLink: Boolean(!input.session.meeting_url && generatedMeetingUrl),
  } satisfies AcademyCalendarSyncResult;
}
