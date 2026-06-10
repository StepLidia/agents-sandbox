import { ContactContent } from '../components/ContactCard';
import { Header } from '../components/Header';

export function ContactPage() {
  return (
    <>
      <Header
        title="Contact"
        subtitle="Form for your inquiries"
        showActions={false}
      />
      <div className="mt-6 max-w-2xl">
        <ContactContent />
      </div>
    </>
  );
}
