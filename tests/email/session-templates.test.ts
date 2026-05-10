import assert from "node:assert/strict";
import test from "node:test";

import { renderSessionRecapTemplate } from "../../src/lib/email/templates/session-recap.ts";
import { renderSessionScheduledTemplate } from "../../src/lib/email/templates/session-scheduled.ts";

test("renderSessionRecapTemplate includes the protected recording path and fallback copy", () => {
  const template = renderSessionRecapTemplate({
    parentName: "Jordan",
    studentName: "Avery",
    sessionDateLabel: "May 8, 2026 at 3:00 PM",
    subject: "Geometry",
    courseName: null,
    whatWasCovered: "Triangle congruence",
    studentUnderstood: "SSS and SAS",
    studentStruggledWith: "Proof setup",
    recommendedHomework: null,
    recordingUrl: "/parent/sessions/session_123/recording",
    recordingExpirationLabel: "Available until May 15",
    nextSessionLabel: null,
  });

  assert.equal(template.subject, "Deebo Academy Session Summary for Avery");
  assert.match(template.text, /Recording link: \/parent\/sessions\/session_123\/recording/);
  assert.match(template.text, /Homework \/ next steps:\nNo homework was assigned\./);
  assert.match(template.html, /<a href="\/parent\/sessions\/session_123\/recording">/);
  assert.match(template.html, /No next session is scheduled yet\./);
});

test("renderSessionScheduledTemplate includes scheduling details and pending fallbacks", () => {
  const template = renderSessionScheduledTemplate({
    parentName: "Jordan",
    studentName: "Avery",
    sessionDateLabel: "May 8, 2026 at 3:00 PM",
    subject: "Geometry",
    courseName: "Geometry Foundations",
    tutorName: null,
    meetingUrl: null,
  });

  assert.equal(template.subject, "Deebo Academy Session Scheduled for Avery");
  assert.match(template.text, /Tutor: To be confirmed/);
  assert.match(template.text, /Meeting link: Not attached yet/);
  assert.match(template.html, /Geometry Foundations/);
  assert.match(template.html, /Not attached yet/);
});
