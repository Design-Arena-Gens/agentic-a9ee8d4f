'use client';

import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import type { PaperRecord } from '@/app/lib/types';

interface SearchParams {
  query: string;
  startYear?: string;
  endYear?: string;
  publicationType?: string;
}

type Status = 'idle' | 'loading' | 'error' | 'success';

const publicationTypeOptions = [
  { value: '', label: 'Any publication type' },
  { value: 'Clinical Trial', label: 'Clinical Trial' },
  { value: 'Review', label: 'Review & Survey' },
  { value: 'Meta Analysis', label: 'Meta Analysis' },
  { value: 'Case Report', label: 'Case Report' },
  { value: 'Conference', label: 'Conference' },
];

export default function SearchForm() {
  const [params, setParams] = useState<SearchParams>({ query: '' });
  const [results, setResults] = useState<PaperRecord[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number | null>(null);

  const handleChange = (field: keyof SearchParams) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = event.target.value;
      setParams((prev) => ({ ...prev, [field]: value }));
    };

  const normalizedFilters = useMemo(() => {
    const payload: Record<string, string> = { query: params.query.trim() };
    if (params.startYear) payload.startYear = params.startYear;
    if (params.endYear) payload.endYear = params.endYear;
    if (params.publicationType) payload.publicationType = params.publicationType;
    return payload;
  }, [params]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!params.query.trim()) {
      setError('Enter a research topic, drug target, or molecule.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setError(null);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(normalizedFilters),
      });

      if (!response.ok) {
        throw new Error('Unable to fetch research papers. Try refining your filters.');
      }

      const data = (await response.json()) as {
        papers: PaperRecord[];
        total: number;
      };

      setResults(data.papers);
      setTotal(data.total);
      setStatus('success');
    } catch (requestError) {
      console.error(requestError);
      setError(requestError instanceof Error ? requestError.message : 'Unexpected error');
      setStatus('error');
    }
  };

  const shouldShowEmptyState = status === 'success' && results.length === 0;

  return (
    <>
      <section className="form-card">
        <form className="search-form" onSubmit={handleSubmit}>
          <div className="search-row">
            <input
              className="search-input"
              placeholder="Search drug development literature (e.g. mRNA vaccines, CAR-T, PROTAC)"
              value={params.query}
              onChange={handleChange('query')}
              aria-label="Search query"
            />
            <button
              className="search-button"
              type="submit"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Searching…' : 'Search'}
            </button>
          </div>

          <section className="advanced-section" aria-label="Advanced filters">
            <div className="filters-grid">
              <input
                className="filter-input"
                type="number"
                inputMode="numeric"
                placeholder="Start year"
                value={params.startYear ?? ''}
                onChange={handleChange('startYear')}
                aria-label="Filter by start publication year"
                min={1900}
                max={new Date().getFullYear()}
              />

              <input
                className="filter-input"
                type="number"
                inputMode="numeric"
                placeholder="End year"
                value={params.endYear ?? ''}
                onChange={handleChange('endYear')}
                aria-label="Filter by end publication year"
                min={1900}
                max={new Date().getFullYear()}
              />

              <select
                className="filter-select"
                value={params.publicationType ?? ''}
                onChange={handleChange('publicationType')}
                aria-label="Filter by publication type"
              >
                {publicationTypeOptions.map((option) => (
                  <option key={option.value || 'any'} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </section>
        </form>
      </section>

      {status === 'loading' && (
        <div className="loading-indicator" role="status" aria-live="polite">
          <span className="loading-dot" />
          <span className="loading-dot" />
          <span className="loading-dot" />
        </div>
      )}

      {status === 'error' && error && (
        <div className="error-state" role="alert">
          {error}
        </div>
      )}

      {shouldShowEmptyState && (
        <div className="empty-state">
          <p>No papers found for that query. Try expanding your keywords or date range.</p>
        </div>
      )}

      {status === 'success' && results.length > 0 && (
        <ResultsSection papers={results} total={total ?? results.length} query={params.query} />
      )}
    </>
  );
}

function ResultsSection({
  papers,
  total,
  query,
}: {
  papers: PaperRecord[];
  total: number;
  query: string;
}) {
  return (
    <section aria-label="Search results">
      <header className="result-summary" style={{ marginBottom: '1rem' }}>
        <p>
          Showing {papers.length} of {total.toLocaleString()} results for “{query}”.
        </p>
      </header>
      <div className="results-grid">
        {papers.map((paper) => (
          <ResultCard key={paper.paperId} paper={paper} />
        ))}
      </div>
    </section>
  );
}

function ResultCard({ paper }: { paper: PaperRecord }) {
  const authors = paper.authors?.map((author) => author.name).join(', ');

  return (
    <article className="result-card">
      <header>
        <h2 className="result-title">{paper.title}</h2>
        <div className="result-meta">
          {paper.year ? <span className="badge">{paper.year}</span> : null}
          {paper.venue ? <span className="badge">{paper.venue}</span> : null}
          {paper.publicationTypes?.slice(0, 2).map((type) => (
            <span className="badge" key={type}>
              {type}
            </span>
          ))}
        </div>
      </header>

      {authors && (
        <p className="result-authors" style={{ color: 'rgba(214,225,255,0.65)' }}>
          {authors}
        </p>
      )}

      {paper.abstract && (
        <p className="result-abstract">
          {paper.abstract.length > 640
            ? `${paper.abstract.slice(0, 640)}…`
            : paper.abstract}
        </p>
      )}

      <footer className="result-footer">
        {paper.journal?.name ? (
          <span>{paper.journal.name}</span>
        ) : (
          <span>{paper.venue}</span>
        )}
        {paper.url ? (
          <a className="result-link" href={paper.url} target="_blank" rel="noopener noreferrer">
            View paper ↗
          </a>
        ) : null}
      </footer>
    </article>
  );
}
