import { useState, useCallback, useRef } from 'react';
import { FeedbackForm, FormErrors, CustomFile } from '@/features/Core/types/global';

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.replace(/^data:image\/(jpeg|png);base64,/, ''));
      } else {
        reject('Failed to convert file to base64');
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export const useFeedbackForm = () => {
  const [form, setForm] = useState<FeedbackForm>({
    category: 'Suggestion',
    comments: '',
    steps: '',
    screenshots: [],
    base64Screenshots: [],
  });

  const [errors, setErrors] = useState<FormErrors>({
    category: false,
    comments: false,
    steps: false,
  });

  const [touched, setTouched] = useState<Record<keyof FormErrors, boolean>>({
    category: false,
    comments: false,
    steps: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileChangeGenerationRef = useRef(0);

  const updateField = <K extends keyof FeedbackForm>(key: K, value: FeedbackForm[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (key in errors) {
      setErrors(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleFieldBlur = (field: keyof FormErrors) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const showFieldError = (field: keyof FormErrors) => {
    return touched[field] && errors[field];
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {
      category: !form.category,
      comments: !form.comments.trim(),
      steps: form.category === 'Bug Report' && !form.steps.trim(),
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const resetForm = () => {
    fileChangeGenerationRef.current += 1;
    setForm({
      category: 'Suggestion',
      comments: '',
      steps: '',
      screenshots: [],
      base64Screenshots: [],
    });
    setErrors({
      category: false,
      comments: false,
      steps: false,
    });
    setTouched({
      category: false,
      comments: false,
      steps: false,
    });
    setSubmitError(null);
  };

  const handleFileChange = useCallback(async (files: CustomFile[]) => {
    const generation = ++fileChangeGenerationRef.current;

    if (files.length === 0) {
      setForm(prev => ({ ...prev, screenshots: [], base64Screenshots: [] }));
      return;
    }

    setForm(prev => ({ ...prev, screenshots: files }));

    const base64Results = await Promise.all(
      files.map(async (file) => {
        try {
          return await fileToBase64(file.file);
        } catch (error) {
          console.error('Failed to process file:', error);
          return null;
        }
      })
    );

    if (generation !== fileChangeGenerationRef.current) return;

    setForm(prev => ({ ...prev, base64Screenshots: base64Results.filter(Boolean) as string[] }));
  }, []);

  return {
    form,
    errors,
    touched,
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
  };
};
