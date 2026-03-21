/**
 * Lightweight PDF Export Utility
 * 
 * To respect strict zero-dependency architectures and limit bundle sizing,
 * this utility overrides the standard CSS of the browser and invokes the native
 * print engine to generate flawless PDF reports without importing `html2canvas` or `jsPDF`.
 */

export const triggerNativePdfReport = (title: string = 'Pravhatattva Analytical Report') => {
  // Alter document title temporarily so the generated PDF file has the correct name
  const originalTitle = document.title;
  document.title = title;

  try {
    // Rely on native browser print dialog, users format to "Save as PDF"
    window.print();
  } catch (error) {
    console.error('PDF Engine failure:', error);
  } finally {
    // Restore title instantly
    document.title = originalTitle;
  }
};
