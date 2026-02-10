import { useCallback, FormEvent, useState, ReactNode } from "react";
import styles from "./SendFeedbackForm.module.scss";
import Button from "@/features/Core/components/Button/Button";
import TextInput from "@/features/Core/components/TextInput/TextInput";
import FileInput from "@/features/Common/components/FileInput/FileInput";
import Select from "@/features/Common/components/Select/Select";
import { Fade } from "react-awesome-reveal";
import { getDataFromQueryVar } from "@/features/Common/utils/utilities";
import { useFeedbackForm } from "@/features/Common/hooks/customHooks";
import { CustomFile } from "@/features/Common/types/global";
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
    setIsSubmitting,
    setSubmitError,
  } = useFeedbackForm();

  const [createdIssueURL, setCreatedIssueURL] = useState<string | null>(null);
  const currentARSpk = (getDataFromQueryVar("q", window.location.search) !== null) ? getDataFromQueryVar("q", window.location.search) : "";

  const errorMessages = {
    category: "Please select a category.",
    comments: "Please provide a comment.",
    steps: "Please detail the steps you took to produce the error.",
  };

  const getBase64 = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = () => {
        if (reader.result) {
          const baseString = (reader.result as string).replace(/^data:image\/(jpeg|png);base64,/, "");
          resolve(baseString);
        } else {
          reject('Failed to convert file to base64');
        }
      };
      
      reader.onerror = (error) => reject(error);
    });
  };

  const processFiles = useCallback(async (files: CustomFile[]) => {
    const base64Promises = files.map(async (file) => {
      try {
        return await getBase64(file.file);
      } catch (error) {
        console.error('Failed to process file:', error);
        return null;
      }
    });

    const base64Results = await Promise.all(base64Promises);
    const validBase64s = base64Results.filter(Boolean) as string[];
    
    updateField('base64Screenshots', validBase64s);
  }, [updateField]);

  const handleFileChange = useCallback((files: CustomFile[]) => {
    updateField('screenshots', files);
    if (files.length > 0) {
      processFiles(files);
    } else {
      updateField('base64Screenshots', []);
    }
  }, [processFiles, updateField]);

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
          url: encodeURI(decodeURIComponent(getDataFromQueryVar("link", window.location.search) as string)),
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
                    subtitle="Please be as detailed as you can to help us identify this bug."
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
