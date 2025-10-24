"use client";

import { useState } from "react";
import { 
  Mail, 
  Phone, 
  Building, 
  FileText, 
  Send, 
  CheckCircle, 
  AlertCircle,
  Loader2
} from "lucide-react";

interface ContactFormProps {
  type: 'demo' | 'quote';
  title?: string;
  description?: string;
}

export default function ContactForm({ 
  type, 
  title = type === 'demo' ? 'Richiedi Demo' : 'Richiedi Preventivo',
  description = type === 'demo' 
    ? 'Scopri come RescueManager può migliorare la tua gestione del soccorso stradale'
    : 'Ottieni un preventivo personalizzato per la tua azienda'
}: ContactFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          type,
          source: 'website'
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        setFormData({ name: '', email: '', phone: '', company: '', message: '' });
      } else {
        setError(result.error || 'Errore durante l\'invio');
      }
    } catch (err) {
      setError('Errore durante l\'invio della richiesta');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg border border-gray-200 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Richiesta Inviata!</h3>
        <p className="text-gray-600 mb-4">
          Grazie per il tuo interesse. Ti contatteremo presto per organizzare la {type === 'demo' ? 'demo' : 'preventivo'}.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="text-primary hover:text-primary/80 font-medium"
        >
          Invia un'altra richiesta
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nome Completo *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200"
            placeholder="Mario Rossi"
            value={formData.name}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="email"
              id="email"
              name="email"
              required
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200"
              placeholder="mario@azienda.it"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Telefono
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="tel"
              id="phone"
              name="phone"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200"
              placeholder="+39 333 123 4567"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
        </div>

        <div>
          <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
            Azienda
          </label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              id="company"
              name="company"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200"
              placeholder="Trasporti Rossi SRL"
              value={formData.company}
              onChange={handleChange}
            />
          </div>
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            Messaggio
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <textarea
              id="message"
              name="message"
              rows={4}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 resize-none"
              placeholder={type === 'demo' 
                ? 'Descrivi le tue esigenze per la demo...'
                : 'Descrivi i tuoi requisiti per il preventivo...'
              }
              value={formData.message}
              onChange={handleChange}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Invio in corso...
            </>
          ) : (
            <>
              <Send className="h-5 w-5" />
              {type === 'demo' ? 'Richiedi Demo' : 'Richiedi Preventivo'}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
