import jsPDF from 'jspdf';
import * as htmlToImage from 'html-to-image';

interface ExportPdfOptions {
  filename?: string;
  orientation?: 'p' | 'l';
  unit?: 'mm' | 'pt' | 'cm' | 'in';
  format?: string | [number, number];
  margin?: number;
}

/**
 * HTML elementini PDF olarak dışa aktarır
 */
export const exportElementToPdf = async (
  elementId: string, 
  options: ExportPdfOptions = {}
) => {
  const {
    filename = 'document.pdf',
    orientation = 'p',
    unit = 'mm',
    format = 'a4',
    margin = 10
  } = options;

  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return;
  }

  try {
    // Görünmez elementin renderlanmasını bekle
    // Not: Elementin görünür olması gerekebilir veya absolute/off-screen olabilir
    
    const imgData = await htmlToImage.toPng(element, {
      pixelRatio: 2, // Daha yüksek kalite için
      backgroundColor: '#ffffff',
      fontEmbedCSS: '' // Yabancı stylesheet'lerin CORS ve cssRules hatasını (Chrome eklentileri vb.) engellemek için
    });

    
    // PDF boyutunu hesapla
    const pdf = new jsPDF(orientation, unit, format);
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Resmi PDF'e sığdır (oranı koruyarak)
    const imgProps = pdf.getImageProperties(imgData);
    const ratio = imgProps.width / imgProps.height;
    
    let renderWidth = pdfWidth - (margin * 2);
    let renderHeight = renderWidth / ratio;
    
    // Eğer yükseklik sayfayı taşıyorsa yüksekliğe göre ölçekle
    if (renderHeight > (pdfHeight - (margin * 2))) {
      renderHeight = pdfHeight - (margin * 2);
      renderWidth = renderHeight * ratio;
    }

    pdf.addImage(imgData, 'PNG', margin, margin, renderWidth, renderHeight);
    pdf.save(filename);
    
    return true;
  } catch (error) {
    console.error('PDF generation error:', error);
    return false;
  }
};
