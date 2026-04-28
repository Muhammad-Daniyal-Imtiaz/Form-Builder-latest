'use client'

import React, { useState } from 'react';
import DOMPurify from 'dompurify';
import { FormType, FieldType } from '../lib/form-schema';

interface SecureFormRendererProps {
  formData: FormType;
}

const SecureFormRenderer: React.FC<SecureFormRendererProps> = ({ formData }) => {
  const [formDataState, setFormDataState] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleChange = (fieldId: string, value: any) => {
    setFormDataState(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Submit form data to your backend
      const response = await fetch('/api/submit-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formId: formData.id,
           formDataState,
        }),
      });

      if (response.ok) {
        setSubmitSuccess(true);
        setTimeout(() => setSubmitSuccess(false), 5000);
      }
    } catch (error) {
      console.error('Submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sanitize content before rendering
  const sanitizeText = (text: string) => {
    return DOMPurify.sanitize(text, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: []
    });
  };

  const renderField = (field: FieldType) => {
    const sanitizedLabel = sanitizeText(field.label);
    const sanitizedPlaceholder = field.placeholder ? sanitizeText(field.placeholder) : '';

    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <div key={field.id} className="mb-4">
            <label htmlFor={field.id} className="block text-sm font-medium mb-1">
              {sanitizedLabel} {field.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type={field.type}
              id={field.id}
              name={field.id}
              value={formDataState[field.id] || ''}
              onChange={(e) => handleChange(field.id, e.target.value)}
              placeholder={sanitizedPlaceholder}
              required={field.required}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id} className="mb-4">
            <label htmlFor={field.id} className="block text-sm font-medium mb-1">
              {sanitizedLabel} {field.required && <span className="text-red-500">*</span>}
            </label>
            <textarea
              id={field.id}
              name={field.id}
              value={formDataState[field.id] || ''}
              onChange={(e) => handleChange(field.id, e.target.value)}
              placeholder={sanitizedPlaceholder}
              rows={field.rows || 4}
              required={field.required}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        );

      case 'select':
        return (
          <div key={field.id} className="mb-4">
            <label htmlFor={field.id} className="block text-sm font-medium mb-1">
              {sanitizedLabel} {field.required && <span className="text-red-500">*</span>}
            </label>
            <select
              id={field.id}
              name={field.id}
              value={formDataState[field.id] || ''}
              onChange={(e) => handleChange(field.id, e.target.value)}
              required={field.required}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">Select an option</option>
              {field.options?.map((option) => (
                <option key={option} value={option}>
                  {sanitizeText(option)}
                </option>
              ))}
            </select>
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.id} className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name={field.id}
                checked={!!formDataState[field.id]}
                onChange={(e) => handleChange(field.id, e.target.checked)}
                required={field.required}
                className="mr-2"
              />
              <span>{sanitizedLabel} {field.required && <span className="text-red-500">*</span>}</span>
            </label>
          </div>
        );

      case 'radio':
        return (
          <div key={field.id} className="mb-4">
            <legend className="block text-sm font-medium mb-1">
              {sanitizedLabel} {field.required && <span className="text-red-500">*</span>}
            </legend>
            {field.options?.map((option) => (
              <label key={option} className="flex items-center mb-1">
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  checked={formDataState[field.id] === option}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  required={field.required}
                  className="mr-2"
                />
                <span>{sanitizeText(option)}</span>
              </label>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  if (submitSuccess) {
    return (
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Success! </strong>
        <span className="block sm:inline">{DOMPurify.sanitize(formData.settings?.successMessage || 'Form submitted successfully!')}</span>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">{DOMPurify.sanitize(formData.title)}</h2>
      
      {formData.description && (
        <p className="mb-4 text-gray-600">{DOMPurify.sanitize(formData.description)}</p>
      )}

      <form onSubmit={handleSubmit}>
        {formData.fields.map(renderField)}

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-2 px-4 rounded-md text-white ${
            isSubmitting ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isSubmitting ? 'Submitting...' : DOMPurify.sanitize(formData.settings?.submitButtonText || 'Submit')}
        </button>
      </form>
    </div>
  );
};

export default SecureFormRenderer;
