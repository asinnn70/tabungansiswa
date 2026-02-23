import React, { useRef, useState } from 'react';
import { Student } from '../types';
import { CreditCard, QrCode, User, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface StudentCardProps {
  student: Student;
}

export const StudentCard: React.FC<StudentCardProps> = ({ student }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Generate a simple QR code URL using a public API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${student.nis}`;

  const handleDownloadPDF = async () => {
    if (!cardRef.current) return;
    
    setIsGenerating(true);
    try {
      // Capture the card element with high quality settings
      const canvas = await html2canvas(cardRef.current, {
        scale: 4, // Higher scale for crisp text
        useCORS: true, // Enable CORS for images
        allowTaint: true,
        backgroundColor: null, // Transparent background
        logging: false,
        imageTimeout: 0, // Wait for images to load
      });

      // Calculate dimensions
      const imgData = canvas.toDataURL('image/png', 1.0);
      
      // Standard ID-1 card size: 85.60 × 53.98 mm
      // We use explicit dimensions to avoid "Invalid argument" errors
      const cardWidth = 85.6;
      const cardHeight = 53.98;

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [cardWidth, cardHeight] // Explicitly set size
      });

      // Add image to PDF covering the full page
      pdf.addImage(imgData, 'PNG', 0, 0, cardWidth, cardHeight);
      
      // Save the PDF
      pdf.save(`Kartu_Siswa_${student.name.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Gagal membuat PDF. Silakan coba lagi atau periksa koneksi internet Anda (untuk memuat gambar).');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Front Side - Pure Inline Styles for PDF Safety */}
      <div 
        ref={cardRef}
        className="printable-card"
        style={{ 
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '16px', // rounded-2xl
          color: 'white', // text-white
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', // shadow-2xl (approx)
          aspectRatio: '1.6 / 1',
          padding: '24px', // p-6
          background: 'linear-gradient(to bottom right, #059669, #115e59)', // emerald-600 to teal-800
          fontFamily: 'sans-serif', // Ensure font is standard
          width: '100%', // Ensure width is captured
          maxWidth: '600px' // Prevent it from being too wide in capture
        }}
      >
        {/* Background Pattern 1 */}
        <div 
          style={{ 
            position: 'absolute',
            top: '0',
            right: '0',
            marginRight: '-64px',
            marginTop: '-64px',
            width: '256px',
            height: '256px',
            borderRadius: '9999px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            filter: 'blur(64px)',
            zIndex: 0
          }}
        ></div>
        {/* Background Pattern 2 */}
        <div 
          style={{ 
            position: 'absolute',
            bottom: '0',
            left: '0',
            marginLeft: '-64px',
            marginBottom: '-64px',
            width: '192px',
            height: '192px',
            borderRadius: '9999px',
            backgroundColor: 'rgba(52, 211, 153, 0.2)',
            filter: 'blur(40px)',
            zIndex: 0
          }}
        ></div>

        <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 10 }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div 
                style={{ 
                  padding: '6px', 
                  borderRadius: '8px', 
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(4px)'
                }}
              >
                <CreditCard size={24} color="white" />
              </div>
              <div>
                <h3 style={{ fontWeight: 'bold', fontSize: '14px', lineHeight: '1', margin: 0 }}>KARTU TABUNGAN</h3>
                <p style={{ fontSize: '10px', fontWeight: '500', marginTop: '2px', color: '#d1fae5', margin: 0 }}>
                  SMK NEGERI CONTOH
                </p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span 
                style={{ 
                  fontSize: '10px', 
                  fontWeight: 'bold', 
                  padding: '2px 8px', 
                  borderRadius: '9999px', 
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(4px)',
                  display: 'inline-block'
                }}
              >
                MEMBER CARD
              </span>
            </div>
          </div>

          {/* Body */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
            <div 
              style={{ 
                width: '96px', 
                height: '96px', 
                borderRadius: '12px', 
                border: '1px solid rgba(255, 255, 255, 0.2)', 
                overflow: 'hidden', 
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(4px)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center'
              }}
            >
              {student.photo_url ? (
                <img 
                  src={student.photo_url} 
                  alt={student.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous" 
                />
              ) : (
                <User size={48} color="rgba(255,255,255,0.4)" />
              )}
            </div>
            <div style={{ flex: 1, paddingBottom: '4px' }}>
              <h4 style={{ fontSize: '18px', fontWeight: 'bold', lineHeight: '1.25', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0, marginBottom: '8px' }}>
                {student.name}
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <p style={{ fontSize: '8px', textTransform: 'uppercase', fontWeight: 'bold', color: '#a7f3d0', margin: 0 }}>NIS</p>
                  <p style={{ fontSize: '14px', fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '0.05em', margin: 0 }}>{student.nis}</p>
                </div>
                <div>
                  <p style={{ fontSize: '8px', textTransform: 'uppercase', fontWeight: 'bold', color: '#a7f3d0', margin: 0 }}>KELAS</p>
                  <p style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>{student.class}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '8px' }}>
            <p style={{ fontSize: '8px', fontStyle: 'italic', color: 'rgba(209, 250, 229, 0.6)', margin: 0 }}>
              Berlaku selama menjadi siswa aktif
            </p>
            <div style={{ backgroundColor: 'white', padding: '4px', borderRadius: '6px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
              <img 
                src={qrCodeUrl} 
                alt="QR Code" 
                style={{ width: '40px', height: '40px', display: 'block' }}
                crossOrigin="anonymous" 
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center print-hidden">
        <button 
          onClick={handleDownloadPDF}
          disabled={isGenerating}
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Memproses...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Unduh Kartu PDF
            </>
          )}
        </button>
        <p className="text-xs text-slate-400 mt-3 italic">Kartu akan diunduh dalam format PDF siap cetak.</p>
      </div>
    </div>
  );
};
