/**
 * @file  pages/PaymentPage.tsx
 * @desc  Simulated payment module with smart routing.
 *
 * Logic:
 *   - If payment exists (COMPLETED) → show ticket directly (step 3)
 *   - If booking is CONFIRMED but not paid → show payment flow (steps 1-3)
 *   - If booking is not CONFIRMED → redirect to dashboard
 *
 * Flow for unpaid bookings:
 *   1. User arrives from /dashboard with a bookingId (CONFIRMED booking)
 *   2. Fills in card form (simulated — no real data sent to any gateway)
 *   3. Processing animation (1.5–2s)
 *   4. Success → ticket displayed
 *   5. Ticket can be printed (window.print) or downloaded as PDF (jsPDF)
 *
 * Test cards:
 *    Any 16-digit number NOT ending in 0002 → ACCEPTED
 *   **** **** **** 0002                   → DECLINED
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate }       from 'react-router-dom';
import { toast }                        from 'react-toastify';
import {
  FaCreditCard, FaLock, FaCheckCircle, FaTimesCircle,
  FaPrint, FaDownload, FaArrowLeft, FaSpinner, FaCar,
  FaCalendar, FaUser, FaReceipt, FaShieldAlt,
} from 'react-icons/fa';
import { paymentAPI, bookingAPI }       from '../services/api';
import { useTranslation }               from '../i18n';
import { useAuth }                      from '../hooks/useAuth';
import { logger }                       from '../utils/logger';

const CTX = 'PaymentPage';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Ticket {
  transactionId: string;
  paymentId:     string;
  bookingId:     string;
  processedAt:   string;
  customer:      { name: string; email: string };
  vehicle:       { label: string; image: string | null };
  startDate:     string;
  endDate:       string;
  totalDays:     number;
  amount:        number;
  currency:      string;
  paymentMethod: string;
  cardMasked:    string;
  cardHolder:    string;
  status:        string;
}

interface BookingSummary {
  id:         string;
  totalPrice: number;
  totalDays:  number;
  startDate:  string;
  endDate:    string;
  status:     string;
  paymentStatus?: string;
  vehicle?:   { brand: string; model: string; year: number; imageUrl?: string };
}

// ── Card input formatter ──────────────────────────────────────────────────────
const formatCardNumber = (v: string) =>
  v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

const formatExpiry = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

// ── Step components ───────────────────────────────────────────────────────────

/** Step indicator */
const Steps = ({ current }: { current: 1 | 2 | 3 }) => {
  const steps = [
    { n: 1, label: 'Récapitulatif' },
    { n: 2, label: 'Paiement' },
    { n: 3, label: 'Confirmation' },
  ];
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center">
          <div className={`flex flex-col items-center`}>
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              current > s.n  ? 'bg-green-500 text-white' :
              current === s.n ? 'bg-primary-dark text-white ring-4 ring-primary-light/30' :
                               'bg-gray-200 text-gray-400'
            }`}>
              {current > s.n ? <FaCheckCircle size={16} /> : s.n}
            </div>
            <span className={`text-xs mt-1 font-medium ${
              current >= s.n ? 'text-primary-dark' : 'text-gray-400'
            }`}>{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-16 h-0.5 mx-1 mb-5 transition-all ${
              current > s.n ? 'bg-green-500' : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  );
};

// ── Ticket component (also used for print / PDF) ──────────────────────────────
const PaymentTicket = ({ ticket, ref: _ref }: { ticket: Ticket; ref?: any }) => {
  const fmt  = (d: string) => new Date(d).toLocaleDateString('fr-FR');
  const fmtT = (d: string) => new Date(d).toLocaleString('fr-FR');
  const methodLabel = ticket.paymentMethod === 'CARD' ? 'Carte bancaire' : ticket.paymentMethod;

  return (
    <div id="payment-ticket" className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden max-w-lg mx-auto">

      {/* Header */}
      <div className="bg-primary-dark px-6 py-5 text-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FaReceipt size={18} />
            <span className="font-bold text-lg">Ticket de paiement</span>
          </div>
          <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
            <FaCheckCircle size={11} /> PAYÉ
          </span>
        </div>
        <p className="text-blue-200 text-xs font-mono">{ticket.transactionId}</p>
        <p className="text-blue-300 text-xs mt-0.5">{fmtT(ticket.processedAt)}</p>
      </div>

      {/* Vehicle image */}
      {ticket.vehicle.image && (
        <div className="relative h-32 bg-gray-100">
          <img
            src={ticket.vehicle.image}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <p className="absolute bottom-2 left-4 text-white font-bold text-sm drop-shadow">
            {ticket.vehicle.label}
          </p>
        </div>
      )}

      {/* Body */}
      <div className="px-6 py-4 space-y-3">

        {/* Client */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-light/10 flex items-center justify-center flex-shrink-0">
            <FaUser size={13} className="text-primary-dark" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Client</p>
            <p className="text-sm font-semibold text-gray-800">{ticket.customer.name}</p>
            <p className="text-xs text-gray-500">{ticket.customer.email}</p>
          </div>
        </div>

        <div className="border-t border-dashed border-gray-200" />

        {/* Vehicle (without image) */}
        {!ticket.vehicle.image && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-light/10 flex items-center justify-center flex-shrink-0">
              <FaCar size={13} className="text-primary-dark" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Véhicule</p>
              <p className="text-sm font-semibold text-gray-800">{ticket.vehicle.label}</p>
            </div>
          </div>
        )}

        {/* Dates */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-light/10 flex items-center justify-center flex-shrink-0">
            <FaCalendar size={13} className="text-primary-dark" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Période de location</p>
            <p className="text-sm font-semibold text-gray-800">
              {fmt(ticket.startDate)} → {fmt(ticket.endDate)}
            </p>
            <p className="text-xs text-gray-500">{ticket.totalDays} jour{ticket.totalDays > 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="border-t border-dashed border-gray-200" />

        {/* Payment details */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-xs text-gray-400">Mode de paiement</p>
            <p className="font-medium text-gray-700">{methodLabel}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Carte</p>
            <p className="font-mono font-medium text-gray-700">{ticket.cardMasked}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Titulaire</p>
            <p className="font-medium text-gray-700">{ticket.cardHolder}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Réf. réservation</p>
            <p className="font-mono text-xs text-gray-500">{ticket.bookingId.slice(0, 8)}…</p>
          </div>
        </div>
      </div>

      {/* Total */}
      <div className="bg-gray-50 border-t border-gray-100 px-6 py-4 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600">Montant total payé</span>
        <span className="text-2xl font-bold text-primary-dark">
          {ticket.amount.toLocaleString()} {ticket.currency}
        </span>
      </div>

      {/* Footer */}
      <div className="bg-primary-dark/5 px-6 py-3 flex items-center gap-2">
        <FaShieldAlt size={12} className="text-gray-400" />
        <p className="text-xs text-gray-400">
          Paiement sécurisé · GIA Vehicle Booking System · Cameroun
        </p>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
export const PaymentPage = () => {
  const { bookingId }       = useParams<{ bookingId: string }>();
  const navigate            = useNavigate();
  const { user }            = useAuth();
  const { lang }            = useTranslation();
  const fr                  = lang === 'fr';
  const ticketRef           = useRef<HTMLDivElement>(null);

  // ── State ──────────────────────────────────────────────────────────────────
  const [step,       setStep]       = useState<1 | 2 | 3>(1);
  const [booking,    setBooking]    = useState<BookingSummary | null>(null);
  const [loadingBk,  setLoadingBk]  = useState(true);
  const [processing, setProcessing] = useState(false);
  const [ticket,     setTicket]     = useState<Ticket | null>(null);
  const [declined,   setDeclined]   = useState(false);

  // Card form
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState(user ? `${user.firstName} ${user.lastName}` : '');
  const [expiry,     setExpiry]     = useState('');
  const [cvv,        setCvv]        = useState('');

  // ── Fetch booking + check if payment exists ───────────────────────────────
  useEffect(() => {
    if (!bookingId) return;
    
    const loadData = async () => {
      try {
        setLoadingBk(true);
        
        // 1. Fetch booking details
        const bookingRes = await bookingAPI.getById(bookingId);
        const bk = bookingRes.data.data.booking ?? bookingRes.data.data;
        
        const bookingData: BookingSummary = {
          id:            bk.id,
          totalPrice:    Number(bk.totalPrice ?? bk.total_price),
          totalDays:     bk.totalDays  ?? bk.total_days,
          startDate:     bk.startDate  ?? bk.start_date,
          endDate:       bk.endDate    ?? bk.end_date,
          status:        bk.status,
          paymentStatus: bk.paymentStatus ?? bk.payment_status,
          vehicle:       bk.vehicle
            ? { brand: bk.vehicle.brand, model: bk.vehicle.model,
                year: bk.vehicle.year, imageUrl: bk.vehicle.imageUrl ?? bk.vehicle.image_url }
            : undefined,
        };
        
        setBooking(bookingData);
        
        // 2. Check if payment already exists (COMPLETED)
        try {
          const paymentRes = await paymentAPI.getTicket(bookingId);
          
          if (paymentRes.data.data.ticket) {
            // Payment exists → go directly to step 3 (ticket display)
            setTicket(paymentRes.data.data.ticket);
            setStep(3);
            logger.info(CTX, 'Existing payment found, showing ticket', { bookingId });
          } else {
            // No payment yet → show payment flow
            setStep(1);
          }
        } catch (err: any) {
          // Payment not found (404) → normal, show payment flow
          if (err?.response?.status === 404) {
            setStep(1);
          } else {
            throw err;
          }
        }
        
      } catch (error: any) {
        logger.error(CTX, 'Failed to load booking', { bookingId, error: error?.message });
        toast.error(fr ? 'Réservation introuvable' : 'Booking not found');
        navigate('/dashboard');
      } finally {
        setLoadingBk(false);
      }
    };
    
    loadData();
  }, [bookingId, navigate, fr]);

  // ── Submit payment ─────────────────────────────────────────────────────────
  const handlePay = async () => {
    const rawCard = cardNumber.replace(/\s/g, '');
    if (rawCard.length < 16) { toast.error('Numéro de carte incomplet'); return; }
    if (!cardHolder.trim())  { toast.error('Nom du titulaire requis');   return; }
    if (expiry.length < 5)   { toast.error('Date d\'expiration invalide'); return; }
    if (cvv.length < 3)      { toast.error('CVV invalide');              return; }

    setProcessing(true);
    setDeclined(false);
    logger.info(CTX, 'Submitting payment', { bookingId });

    try {
      const res = await paymentAPI.process({
        bookingId:  bookingId!,
        cardNumber: rawCard,
        cardHolder: cardHolder.trim(),
        expiryDate: expiry,
        cvv,
        paymentMethod: 'CARD',
      });
      setTicket(res.data.data.ticket);
      setStep(3);
      toast.success('Paiement accepté ! 🎉');
      logger.info(CTX, 'Payment successful', { transactionId: res.data.data.ticket.transactionId });
    } catch (err: any) {
      if (err?.response?.status === 402) {
        setDeclined(true);
        toast.error('Paiement refusé. Vérifiez votre carte.');
      } else {
        toast.error(err?.response?.data?.message || 'Erreur de paiement');
      }
      logger.warn(CTX, 'Payment failed', { status: err?.response?.status });
    } finally {
      setProcessing(false);
    }
  };

  // ── Print ──────────────────────────────────────────────────────────────────
  const handlePrint = () => {
    window.print();
  };

  // ── Download PDF via jsPDF (CDN loaded dynamically) ───────────────────────
  const handleDownloadPDF = async () => {
    if (!ticket) return;
    try {
      // Dynamically load jsPDF from CDN if not already loaded
      if (!(window as any).jspdf) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
          script.onload  = () => resolve();
          script.onerror = () => reject();
          document.head.appendChild(script);
        });
      }

      const { jsPDF } = (window as any).jspdf;
      const doc       = new jsPDF({ unit: 'mm', format: 'a4' });

      const fmt  = (d: string) => new Date(d).toLocaleDateString('fr-FR');
      const fmtT = (d: string) => new Date(d).toLocaleString('fr-FR');

      // ── Colors ──
      const DARK  = [26, 43, 74]   as [number, number, number];
      const LIGHT = [46, 134, 193] as [number, number, number];
      const GREEN = [5, 150, 105]  as [number, number, number];
      const GRAY  = [107, 114, 128] as [number, number, number];

      const W = 210; // A4 width mm
      const M = 20;  // margin

      // ── Header band ──
      doc.setFillColor(...DARK);
      doc.rect(0, 0, W, 38, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('TICKET DE PAIEMENT', M, 14);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(170, 187, 204);
      doc.text(`GIA Vehicle Booking System  ·  Cameroun`, M, 21);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.text(ticket.transactionId, M, 29);
      doc.setFontSize(9);
      doc.setTextColor(170, 187, 204);
      doc.text(fmtT(ticket.processedAt), M, 35);

      // PAYÉ badge
      doc.setFillColor(...GREEN);
      doc.roundedRect(W - M - 22, 10, 22, 8, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('PAYÉ', W - M - 11, 15.5, { align: 'center' });

      // ── Section helper ──
      let y = 48;
      const section = (title: string) => {
        doc.setFillColor(...LIGHT);
        doc.rect(M, y, W - 2 * M, 7, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(title.toUpperCase(), M + 3, y + 5);
        y += 11;
      };

      const row = (label: string, value: string, bold = false) => {
        doc.setTextColor(...GRAY);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(label, M, y);
        doc.setTextColor(30, 30, 30);
        doc.setFont('helvetica', bold ? 'bold' : 'normal');
        doc.text(value, M + 55, y);
        y += 7;
      };

      // ── Client ──
      section('Informations client');
      row('Nom',   ticket.customer.name,  true);
      row('Email', ticket.customer.email);
      y += 3;

      // ── Véhicule ──
      section('Véhicule loué');
      row('Désignation', ticket.vehicle.label, true);
      row('Période',     `${fmt(ticket.startDate)} → ${fmt(ticket.endDate)}`);
      row('Durée',       `${ticket.totalDays} jour${ticket.totalDays > 1 ? 's' : ''}`);
      y += 3;

      // ── Paiement ──
      section('Détails du paiement');
      row('Mode',           ticket.paymentMethod === 'CARD' ? 'Carte bancaire' : ticket.paymentMethod);
      row('Carte',          ticket.cardMasked);
      row('Titulaire',      ticket.cardHolder);
      row('Réf. réservation', ticket.bookingId.slice(0, 8) + '…');
      row('Réf. transaction', ticket.transactionId, true);
      y += 3;

      // ── Total ──
      doc.setFillColor(243, 244, 246);
      doc.rect(M, y, W - 2 * M, 14, 'F');
      doc.setTextColor(...DARK);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Montant total payé', M + 3, y + 9);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(`${ticket.amount.toLocaleString().replace(/\s/g, ' ')} ${ticket.currency}`, W - M - 25, y + 9, { align: 'right' });
      y += 20;

      // ── Footer ──
      doc.setDrawColor(...LIGHT);
      doc.setLineWidth(0.3);
      doc.line(M, y, W - M, y);
      y += 5;
      doc.setTextColor(...GRAY);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.text('Paiement sécurisé simulé · GIA Group · Ce ticket fait office de justificatif de paiement.', W / 2, y, { align: 'center' });

      doc.save(`ticket-${ticket.transactionId}.pdf`);
      toast.success('PDF téléchargé !');
    } catch (e) {
      toast.error('Erreur lors du téléchargement');
      logger.error(CTX, 'PDF generation failed', { error: e });
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loadingBk) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FaSpinner className="animate-spin text-primary-dark text-3xl" />
      </div>
    );
  }

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR');

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <>
      {/* Print styles — hide everything except ticket */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #print-root { display: block !important; }
          #payment-ticket { box-shadow: none !important; border: 1px solid #ddd !important; }
        }
      `}</style>

      {/* Hidden print target */}
      <div id="print-root" style={{ display: 'none' }}>
        {ticket && <PaymentTicket ticket={ticket} />}
      </div>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-2xl">

          {/* Back button */}
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-500 hover:text-primary-dark text-sm mb-6 transition">
            <FaArrowLeft size={13} /> {fr ? 'Retour au dashboard' : 'Back to dashboard'}
          </button>

          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-primary-dark">
              {step === 3 
                ? (fr ? 'Votre ticket de paiement' : 'Your payment ticket')
                : (fr ? 'Paiement de la réservation' : 'Booking Payment')}
            </h1>
            {step !== 3 && (
              <p className="text-gray-400 text-sm mt-1">
                {fr ? 'Environnement de test — aucun débit réel' : 'Test environment — no real charge'}
              </p>
            )}
          </div>

          {/* Steps (only show if not already paid) */}
          {step !== 3 && <Steps current={step} />}

          {/* ── STEP 1 : Récapitulatif ── */}
          {step === 1 && booking && (
            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
              <h2 className="font-bold text-primary-dark text-lg border-b pb-3">
                {fr ? 'Récapitulatif de la réservation' : 'Booking summary'}
              </h2>

              {/* Vehicle */}
              {booking.vehicle && (
                <div className="flex items-center gap-4">
                  {booking.vehicle.imageUrl
                    ? <img src={booking.vehicle.imageUrl} alt="" className="w-20 h-14 object-cover rounded-xl" />
                    : <div className="w-20 h-14 bg-gray-100 rounded-xl flex items-center justify-center">
                        <FaCar className="text-gray-400 text-2xl" />
                      </div>}
                  <div>
                    <p className="font-bold text-gray-800">
                      {booking.vehicle.brand} {booking.vehicle.model}
                    </p>
                    <p className="text-sm text-gray-500">{booking.vehicle.year}</p>
                  </div>
                </div>
              )}

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  [fr ? 'Début' : 'Start',    fmtDate(booking.startDate)],
                  [fr ? 'Fin' : 'End',        fmtDate(booking.endDate)],
                  [fr ? 'Durée' : 'Duration', `${booking.totalDays} ${fr ? 'jour(s)' : 'day(s)'}`],
                  [fr ? 'Statut' : 'Status',  booking.status],
                ].map(([label, value]) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="font-semibold text-sm text-primary-dark">{value}</p>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="flex items-center justify-between bg-primary-dark/5 rounded-xl px-5 py-4">
                <span className="font-medium text-gray-700">{fr ? 'Total à payer' : 'Total due'}</span>
                <span className="text-2xl font-bold text-primary-dark">
                  {booking.totalPrice.toLocaleString()} FCFA
                </span>
              </div>

              {/* Test info banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
                <p className="font-bold mb-1">🧪 {fr ? 'Cartes de test' : 'Test cards'}</p>
                <p>✅ {fr ? 'N\'importe quel n° de 16 chiffres' : 'Any 16-digit number'} → {fr ? 'Accepté' : 'Accepted'}</p>
                <p>❌ **** **** **** <strong>0002</strong> → {fr ? 'Refusé' : 'Declined'}</p>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full bg-primary-dark text-white py-3.5 rounded-xl font-bold hover:bg-primary-light transition flex items-center justify-center gap-2">
                <FaCreditCard /> {fr ? 'Procéder au paiement' : 'Proceed to payment'}
              </button>
            </div>
          )}

          {/* ── STEP 2 : Formulaire carte ── */}
          {step === 2 && (
            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
              <h2 className="font-bold text-primary-dark text-lg border-b pb-3 flex items-center gap-2">
                <FaLock size={14} /> {fr ? 'Informations de paiement' : 'Payment information'}
              </h2>

              {declined && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700">
                  <FaTimesCircle size={18} />
                  <div>
                    <p className="font-bold">{fr ? 'Paiement refusé' : 'Payment declined'}</p>
                    <p className="text-sm">{fr ? 'Veuillez utiliser une autre carte.' : 'Please use a different card.'}</p>
                  </div>
                </div>
              )}

              {/* Card preview */}
              <div className="bg-gradient-to-br from-primary-dark to-primary-light rounded-2xl p-5 text-white shadow-lg">
                <p className="text-xs opacity-70 mb-3">GIA Bank · Carte simulée</p>
                <p className="font-mono text-lg tracking-widest mb-4">
                  {cardNumber || '**** **** **** ****'}
                </p>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs opacity-70">{fr ? 'Titulaire' : 'Card holder'}</p>
                    <p className="font-semibold text-sm">{cardHolder || 'VOTRE NOM'}</p>
                  </div>
                  <div>
                    <p className="text-xs opacity-70">{fr ? 'Expiration' : 'Expires'}</p>
                    <p className="font-semibold text-sm">{expiry || 'MM/YY'}</p>
                  </div>
                </div>
              </div>

              {/* Form fields */}
              <div className="space-y-4">
                {/* Card number */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    {fr ? 'Numéro de carte *' : 'Card number *'}
                  </label>
                  <div className="relative">
                    <FaCreditCard className="absolute left-3 top-3.5 text-gray-400" size={14} />
                    <input
                      className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-primary-light focus:border-transparent transition"
                      value={cardNumber}
                      onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                    />
                  </div>
                </div>

                {/* Card holder */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    {fr ? 'Nom du titulaire *' : 'Card holder name *'}
                  </label>
                  <input
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-light focus:border-transparent transition uppercase"
                    value={cardHolder}
                    onChange={e => setCardHolder(e.target.value.toUpperCase())}
                    placeholder="JEAN DUPONT"
                  />
                </div>

                {/* Expiry + CVV */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      {fr ? 'Expiration *' : 'Expiry *'}
                    </label>
                    <input
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-primary-light focus:border-transparent transition"
                      value={expiry}
                      onChange={e => setExpiry(formatExpiry(e.target.value))}
                      placeholder="MM/YY"
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">CVV *</label>
                    <div className="relative">
                      <FaLock className="absolute left-3 top-3.5 text-gray-400" size={12} />
                      <input
                        type="password"
                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-primary-light focus:border-transparent transition"
                        value={cvv}
                        onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="•••"
                        maxLength={4}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Amount reminder */}
              <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                <span className="text-sm text-gray-600">{fr ? 'Montant à payer' : 'Amount due'}</span>
                <span className="font-bold text-primary-dark text-lg">
                  {booking?.totalPrice.toLocaleString()} FCFA
                </span>
              </div>

              {/* Security notice */}
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <FaShieldAlt size={11} />
                <span>{fr ? 'Paiement simulé sécurisé · Aucune donnée réelle n\'est transmise' : 'Simulated secure payment · No real data is transmitted'}</span>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => { setStep(1); setDeclined(false); }}
                  disabled={processing}
                  className="flex-1 border border-gray-300 text-gray-600 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition disabled:opacity-40">
                  {fr ? 'Retour' : 'Back'}
                </button>
                <button
                  onClick={handlePay}
                  disabled={processing}
                  className="flex-2 flex-grow-[2] bg-primary-dark text-white py-3 rounded-xl font-bold hover:bg-primary-light transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {processing
                    ? <><FaSpinner className="animate-spin" size={14} /> {fr ? 'Traitement...' : 'Processing...'}</>
                    : <><FaLock size={13} /> {fr ? 'Confirmer le paiement' : 'Confirm payment'}</>}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3 : Ticket ── */}
          {step === 3 && ticket && (
            <div className="space-y-4">
              {/* Success banner */}
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3 text-green-700">
                <FaCheckCircle size={24} className="flex-shrink-0" />
                <div>
                  <p className="font-bold">{fr ? 'Paiement confirmé !' : 'Payment confirmed!'}</p>
                  <p className="text-sm">{fr ? 'Votre ticket est disponible ci-dessous.' : 'Your ticket is available below.'}</p>
                </div>
              </div>

              {/* Ticket */}
              <div ref={ticketRef}>
                <PaymentTicket ticket={ticket} />
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handlePrint}
                  className="flex-1 flex items-center justify-center gap-2 border border-primary-dark text-primary-dark py-3 rounded-xl font-semibold hover:bg-primary-dark/5 transition text-sm">
                  <FaPrint size={14} /> {fr ? 'Imprimer' : 'Print'}
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary-dark text-white py-3 rounded-xl font-bold hover:bg-primary-light transition text-sm">
                  <FaDownload size={14} /> {fr ? 'Télécharger PDF' : 'Download PDF'}
                </button>
              </div>

              <button
                onClick={() => navigate('/dashboard')}
                className="w-full text-center text-sm text-gray-400 hover:text-primary-dark transition py-2">
                {fr ? '← Retour au dashboard' : '← Back to dashboard'}
              </button>
            </div>
          )}

        </div>
      </div>
    </>
  );
};