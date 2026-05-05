import { submitAcademyPlacementAttemptAndRedirectAction } from "@/actions/academy-placement";

type PlacementQuestion = {
  id: string;
  question_type: "multiple_choice" | "free_response";
  question_text: string;
  choices: { label: string; value: string }[] | null;
};

type PlacementAttemptFormProps = {
  attemptId: string;
  token?: string | null;
  questions: PlacementQuestion[];
  studentPortalMode?: boolean;
  successRedirect?: string;
  errorRedirect?: string;
};

export function PlacementAttemptForm({
  attemptId,
  token,
  questions,
  studentPortalMode = false,
  successRedirect,
  errorRedirect,
}: PlacementAttemptFormProps) {
  return (
    <form action={submitAcademyPlacementAttemptAndRedirectAction} className="space-y-6">
      <input type="hidden" name="attempt_id" value={attemptId} />
      <input type="hidden" name="student_portal_mode" value={studentPortalMode ? "true" : "false"} />
      {token ? <input type="hidden" name="token" value={token} /> : null}
      {successRedirect ? <input type="hidden" name="success_redirect" value={successRedirect} /> : null}
      {errorRedirect ? <input type="hidden" name="error_redirect" value={errorRedirect} /> : null}

      {questions.map((question, index) => (
        <article key={question.id} className="rounded-2xl border border-border/70 bg-background/50 p-5">
          <p className="text-sm font-medium text-muted-foreground">Question {index + 1}</p>
          <p className="mt-3 whitespace-pre-wrap text-foreground">{question.question_text}</p>

          {question.question_type === "multiple_choice" && question.choices?.length ? (
            <fieldset className="mt-4 space-y-3">
              <legend className="sr-only">{`Answer choices for question ${index + 1}`}</legend>
              {question.choices.map((choice) => (
                <label
                  key={choice.value}
                  className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card/80 px-4 py-3 text-sm text-foreground"
                >
                  <input
                    type="radio"
                    name={`question_${question.id}`}
                    value={choice.value}
                    className="mt-1 h-4 w-4 accent-primary"
                  />
                  <span>{choice.label}</span>
                </label>
              ))}
            </fieldset>
          ) : (
            <textarea
              name={`question_${question.id}`}
              rows={6}
              className="field-input mt-4"
              placeholder="Write your response here."
            />
          )}
        </article>
      ))}

      <button type="submit" className="primary-button">
        Submit placement exam
      </button>
    </form>
  );
}
