import { FormEvent, useState, ReactNode } from "react";
import styles from "./SendFeedbackForm.module.scss";
import Button from "@/features/Core/components/Button/Button";
import TextInput from "@/features/Core/components/TextInput/TextInput";
import FileInput from "@/features/Core/components/FileInput/FileInput";
import Select from "@/features/Core/components/Select/Select";
import { Fade } from "react-awesome-reveal";
import { getDataFromQueryVar } from '@/features/Core/utils/urlHelpers';
import { useFeedbackForm } from "@/features/Core/hooks/useFeedbackForm";
import Feedback from "@/assets/icons/navigation/Feedback.svg?react";

const SendFeedbackForm = () => {
  const {
    form,
    errors,
    isSubmitting,
    submitError,
    updateField,
    handleFieldBlur,
    showFieldError,
    validateForm,
    resetForm,
    handleFileChange,
    setIsSubmitting,
    setSubmitError,
  } = useFeedbackForm();

  const [createdIssueURL, setCreatedIssueURL] = useState<string | null>(null);
  const currentARSpk = getDataFromQueryVar('q', window.location.search) ?? '';
  const feedbackLink = getDataFromQueryVar('link', window.location.search);
  const feedbackUrl = feedbackLink ? encodeURI(decodeURIComponent(feedbackLink)) : '';

  const errorMessages = {
    category: "Please select a category.",
    comments: "Please provide a comment.",
    steps: "Please detail the steps you took to produce the error.",
  };

  const handleSubmission = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('https://issue-router.renci.org/create_issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: feedbackUrl,
          ars_pk: currentARSpk,
          description: form.comments,
          reproduction_steps: form.steps,
          type: form.category,
          screenshots: form.base64Screenshots,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setCreatedIssueURL(data.url);
      resetForm();
    } catch (error) {
      setSubmitError('Failed to submit feedback. Please try again.');
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const ErrorDisplay = ({ errors, errorMessages }: { 
    errors: { category: boolean; comments: boolean; steps: boolean }; 
    errorMessages: Record<string, string> 
  }) => (
    <div>
      {errors.category && <p className={styles.errorText} role="alert">{errorMessages.category}</p>}
      {errors.comments && <p className={styles.errorText} role="alert">{errorMessages.comments}</p>}
      {errors.steps && <p className={styles.errorText} role="alert">{errorMessages.steps}</p>}
    </div>
  );

  const fileInputLabel: ReactNode = <>Add Files <span className="fw-normal">- Optional</span></> as ReactNode;

  return (
    <div className={styles.sendFeedbackFormContainer}>
      {createdIssueURL ? (
        <div className={styles.issueCreatedContainer}>
          <h5 className={styles.title}>Thanks for helping us improve Translator!</h5>
          <p>We really appreciate you sharing your valuable feedback with our team.</p>
          <div className={styles.buttonContainer}>
            <Button 
              variant="secondary" 
              handleClick={() => setCreatedIssueURL(null)} 
              className={styles.newIssue}
              iconLeft={<Feedback/>}
            >
              Send More Feedback
            </Button>
          </div>
        </div>
      ) : (
        <Fade>
          <form 
            onSubmit={handleSubmission} 
            name="send feedback form"
            aria-label="Feedback submission form"
            noValidate
          >
            <fieldset>
              {submitError && (
                <div className={styles.errorContainer}>
                  <p className={styles.errorText} role="alert">{submitError}</p>
                </div>
              )}

              <ErrorDisplay errors={errors} errorMessages={errorMessages} />

              <Select
                label="Category *"
                name="category"
                handleChange={(value) => {
                  updateField('category', value.toString());
                  handleFieldBlur('category');
                }}
                value={form.category}
                error={showFieldError('category')}
                errorText={errorMessages.category}
                testId="category-select"
                noanimate
              >
                <option value="Suggestion" key="0">Suggestion</option>
                <option value="Bug Report" key="1">Bug Report</option>
                <option value="Other Comment" key="2">Other Comment</option>
              </Select>

              {showFieldError('category') && (
                <div id="category-error" className={styles.errorText} role="alert">
                  {errorMessages.category}
                </div>
              )}

              {form.category === 'Bug Report' && (
                <>
                  <TextInput
                    label="Steps to Reproduce *"
                    subtitle="Please be as detailed as you can to help us identify this bug and avoid sharing personal information."
                    rows={3}
                    maxLength={1500}
                    handleChange={(value) => {
                      updateField('steps', value);
                      handleFieldBlur('steps');
                    }}
                    value={form.steps}
                    error={showFieldError('steps')}
                    errorText={errorMessages.steps}
                    testId="steps"
                  />
                  {showFieldError('steps') && (
                    <div id="steps-error" className={styles.errorText} role="alert">
                      {errorMessages.steps}
                    </div>
                  )}
                </>
              )}

              <TextInput
                label="Comments *"
                subtitle="Please avoid sharing personal information."
                rows={5}
                maxLength={1500}
                handleChange={(value) => {
                  updateField('comments', value);
                  handleFieldBlur('comments');
                }}
                value={form.comments}
                error={showFieldError('comments')}
                errorText={errorMessages.comments}
                testId="comments"
              />

              {showFieldError('comments') && (
                <div id="comments-error" className={styles.errorText} role="alert">
                  {errorMessages.comments}
                </div>
              )}

              <FileInput
                label={fileInputLabel}
                buttonLabel="Browse Files"
                fileTypes=".png,.jpg,.jpeg"
                handleChange={handleFileChange}
                multiple
              />

              <p className="caption">Your anonymous feedback will be stored for the sole use of improving Translator.</p>

              <Button 
                type="submit"
                disabled={isSubmitting}
                className={styles.submitButton}
                aria-describedby={isSubmitting ? 'submitting-status' : undefined}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </Button>
              
              {isSubmitting && (
                <div id="submitting-status" className="sr-only" aria-live="polite">
                  Submitting feedback, please wait...
                </div>
              )}
            </fieldset>
          </form>
        </Fade>
      )}
    </div>
  );
};

export default SendFeedbackForm;
