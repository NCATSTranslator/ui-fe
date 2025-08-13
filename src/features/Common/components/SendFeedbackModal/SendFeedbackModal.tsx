import { useState, useCallback, useEffect, FormEvent } from "react";
import styles from "./SendFeedbackModal.module.scss";
import Modal from "@/features/Common/components/Modal/Modal";
import Button from "@/features/Core/components/Button/Button";
import TextInput from "@/features/Core/components/TextInput/TextInput";
import FileInput from "@/features/Common/components/FileInput/FileInput";
import Select from "@/features/Common/components/Select/Select";
import { Fade } from "react-awesome-reveal";
import Info from "@/assets/icons/status/Alerts/Info.svg?react";
import { getDataFromQueryVar } from "@/features/Common/utils/utilities";
import { CustomFile } from "@/features/Common/types/global";

interface SendFeedbackModalProps {
  isOpen?: boolean;
  onClose: () => void;
}

interface FeedbackForm {
  category: string;
  comments: string;
  steps: string;
  screenshots: CustomFile[];
  base64Screenshots: string[];
}

interface FeedbackErrors {
  category: boolean;
  comments: boolean;
  steps: boolean;
}

const categoryErrorText = "Please select a category.";
const commentsErrorText = "Please provide a comment.";
const stepsErrorText = "Please detail the steps you took to produce the error.";

const getBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result.replace(/^data:image\/(jpeg|png);base64,/, ""));
      } else {
        reject("Invalid file content");
      }
    };
    reader.onerror = () => reject("FileReader error");
    reader.readAsDataURL(file);
  });

const SendFeedbackModal = ({ isOpen, onClose }: SendFeedbackModalProps) => {
  const [form, setForm] = useState<FeedbackForm>({
    category: "",
    comments: "",
    steps: "",
    screenshots: [],
    base64Screenshots: [],
  });

  const [errors, setErrors] = useState<FeedbackErrors>({
    category: false,
    comments: false,
    steps: false,
  });

  const [errorActive, setErrorActive] = useState(false);
  const [submit, setSubmit] = useState(false);
  const [createdIssueURL, setCreatedIssueURL] = useState<string | null>(null);

  const modalIsOpen = !!isOpen;

  const updateField = <K extends keyof FeedbackForm>(key: K, value: FeedbackForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key in errors) setErrors((prev) => ({ ...prev, [key]: false }));
  };

  const handleFiles = async (files: CustomFile[]) => {
    updateField("screenshots", files);
    const base64s = await Promise.all(files.map(f => getBase64(f.file)));
    updateField("base64Screenshots", base64s);
  };

  const validateForm = (): boolean => {
    const newErrors: FeedbackErrors = {
      category: form.category === "",
      comments: form.comments === "",
      steps: form.category === "Bug Report" && form.steps === "",
    };
    setErrors(newErrors);
    setErrorActive(Object.values(newErrors).some(Boolean));
    return !Object.values(newErrors).some(Boolean);
  };

  const handleSubmission = (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmit(true);
  };

  const resetFormFields = () => {
    setForm({
      category: "",
      comments: "",
      steps: "",
      screenshots: [],
      base64Screenshots: [],
    });
  };

  const buildPayload = useCallback(() => ({
    url: encodeURI(decodeURIComponent(getDataFromQueryVar("link") || "")),
    ars_pk: getDataFromQueryVar("q"),
    description: form.comments,
    reproduction_steps: form.steps,
    type: form.category,
    screenshots: form.base64Screenshots,
  }),[form]);

  const submitForm = useCallback(() => {
    fetch("https://issue-router.renci.org/create_issue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload()),
    })
      .then((response) => response.json())
      .then((data) => setCreatedIssueURL(data.url))
      .catch((error) => console.error("Error:", error));
    resetFormFields();
  }, [buildPayload]);

  useEffect(() => {
    if (submit) {
      submitForm();
      setSubmit(false);
    }
  }, [submit, submitForm]);

  if (createdIssueURL) {
    return (
      <Modal isOpen={modalIsOpen} onClose={onClose} className={styles.feedbackModal} containerClass={styles.feedbackContainer} testId="send-feedback-modal">
        <div className={styles.issueCreatedContainer}>
          <p>Your feedback has been submitted.<br />Please click the link below to view the status of your issue:</p>
          <Button href={createdIssueURL} _blank rel="noopener noreferrer" className={styles.viewIssue}>View Issue</Button>
          <Button variant="secondary" handleClick={() => setCreatedIssueURL(null)} className={styles.newIssue}>Submit More Feedback</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={modalIsOpen} onClose={onClose} className={styles.feedbackModal} containerClass={styles.feedbackContainer} testId="send-feedback-modal">
      <Fade>
        <h5>Send Feedback</h5>
        <p>Enjoying Translator? Having an issue? Either way, we want to know - use this form to let us know your comments. All fields marked with * are required.</p>
        <p className={styles.disclaimer}><Info />In the meantime, please check out our <a href="/help" target="_blank" rel="noreferrer">Help page</a> for Translator tips, tricks, and tutorials.</p>
        <form onSubmit={handleSubmission} name="send feedback form">
          {errorActive && errors.category && <p className={styles.errorText}>{categoryErrorText}</p>}
          {errorActive && errors.steps && <p className={styles.errorText}>{stepsErrorText}</p>}
          {errorActive && errors.comments && <p className={styles.errorText}>{commentsErrorText}</p>}

          <Select
            label="Category *"
            name="Select One"
            handleChange={(value: string) => updateField("category", value)}
            value={form.category}
            noanimate
            testId="category-select"
          >
            <option value="Suggestion">Suggestion</option>
            <option value="Bug Report">Bug Report</option>
            <option value="Other Comment">Other Comment</option>
          </Select>

          {form.category === "Bug Report" && (
            <TextInput
              label="Steps to Reproduce *"
              rows={3}
              maxLength={1500}
              handleChange={(value: string) => updateField("steps", value)}
              value={form.steps}
              testId="steps"
            />
          )}

          <TextInput
            label="Comments *"
            rows={5}
            maxLength={1500}
            handleChange={(value: string) => updateField("comments", value)}
            value={form.comments}
            testId="comments"
          />

          <FileInput
            buttonLabel="Browse Files"
            fileTypes=".png,.jpg,.jpeg"
            handleChange={handleFiles}
          />

          <Button type="submit" disabled={errorActive}>Send</Button>
        </form>
      </Fade>
    </Modal>
  );
};

export default SendFeedbackModal;
