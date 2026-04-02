import { useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Use CDN worker for broadest compatibility
pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export function usePdfParser() {
  const [fileName, setFileName] = useState('');
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState('');

  const parseFile = useCallback(async (file) => {
    if (!file || file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return null;
    }

    setFileName(file.name);
    setParsing(true);
    setError('');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const textParts = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(' ');
        textParts.push(pageText);
      }

      const fullText = textParts.join('\n\n').replace(/\s+/g, ' ').trim();
      setParsing(false);
      return fullText;
    } catch (err) {
      setError('Failed to parse PDF: ' + err.message);
      setParsing(false);
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setFileName('');
    setError('');
  }, []);

  return { parseFile, fileName, parsing, error, reset };
}
