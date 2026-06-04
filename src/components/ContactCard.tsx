import { useState } from 'react';

export function ContactContent() {
  const [result, setResult] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }
    setIsSubmitting(true);
    setResult("");

    try {
      const formData = new FormData(event.currentTarget);
      formData.append("access_key", import.meta.env.VITE_WEB3FORMS_ACCESS_KEY);

      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setResult(data.message ?? 'Failed to send message.');
        return;
      }

      setResult('Message sent successfully.');
    } catch (error) {
      console.error("Error submitting form:", error);
      setResult('Failed to send message.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="glass-panel space-y-5 p-5"
    >
      <div>
        <label className="mb-2 block text-sm font-bold text-slate-900">
          Name
        </label>
        <input
          type="text"
          name="name"
          required
          className="glass-input w-full px-4 py-3 text-slate-950 outline-none placeholder:text-slate-400"
          placeholder="Your name"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-bold text-slate-900">
          Email
        </label>
        <input
          type="email"
          name="email"
          required
          className="glass-input w-full px-4 py-3 text-slate-950 outline-none placeholder:text-slate-400"
          placeholder="your@email.com"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-bold text-slate-900">
          Message
        </label>
        <textarea
          name="message"
          required
          rows={5}
          className="glass-input w-full resize-none px-4 py-3 text-slate-950 outline-none placeholder:text-slate-400"
          placeholder="Your message"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="glass-control export-button font-semibold disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Sending...' : 'Send message'}
      </button>

      {result && (
        <p className="text-sm font-medium text-slate-700">
          {result}
        </p>
      )}
    </form>
  );
}
