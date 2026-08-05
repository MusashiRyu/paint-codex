import { useEffect, useMemo, useState } from 'react';
import type { PaintList } from '../../app/providers/store';
import {
  generatePaintListMarkdown,
  getExportFilename,
} from './markdownExport';
import styles from './ExportPanel.module.css';

interface ExportPanelProps {
  selectedList?: PaintList;
}

export function ExportPanel({ selectedList }: ExportPanelProps) {
  const [message, setMessage] = useState('');

  const markdown = useMemo(() => {
    if (!selectedList) {
      return '';
    }
    return generatePaintListMarkdown(selectedList);
  }, [selectedList]);

  useEffect(() => {
    setMessage('');
  }, [selectedList?.id]);

  const handleCopy = async () => {
    if (!markdown || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(markdown);
    setMessage('Markdown copied to clipboard.');
  };

  const handleDownload = () => {
    if (!selectedList || !markdown) {
      return;
    }

    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = getExportFilename(selectedList.name);
    anchor.click();
    URL.revokeObjectURL(href);
    setMessage('Markdown downloaded.');
  };

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>Markdown Export</h2>
        <p className={styles.subtitle}>Export your selected list for sharing or shopping.</p>
      </div>

      {!selectedList ? (
        <p className={styles.emptyMessage}>Select a list to generate markdown export.</p>
      ) : (
        <>
          <div className={styles.actions}>
            <button className={styles.primaryButton} onClick={handleDownload}>
              Download .md
            </button>
            <button
              className={styles.secondaryButton}
              onClick={handleCopy}
              disabled={!navigator.clipboard}
            >
              Copy Markdown
            </button>
          </div>

          {message && <p className={styles.message}>{message}</p>}

          <textarea
            className={styles.preview}
            value={markdown}
            readOnly
            aria-label="Markdown export preview"
          />
        </>
      )}
    </section>
  );
}