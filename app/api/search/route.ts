import { NextResponse } from 'next/server';
import type { SearchResponse } from '@/app/lib/types';

const SEMANTIC_SCHOLAR_ENDPOINT = 'https://api.semanticscholar.org/graph/v1/paper/search';
const DEFAULT_LIMIT = 15;

function buildQueryURL({
  query,
  startYear,
  endYear,
  publicationType,
}: {
  query: string;
  startYear?: number;
  endYear?: number;
  publicationType?: string;
}) {
  const url = new URL(SEMANTIC_SCHOLAR_ENDPOINT);
  url.searchParams.set('query', query);
  url.searchParams.set('limit', DEFAULT_LIMIT.toString());
  url.searchParams.set(
    'fields',
    'title,abstract,year,authors,venue,url,publicationTypes,journal'
  );

  const filters: string[] = [];

  if (startYear || endYear) {
    const start = startYear ?? 1900;
    const end = endYear ?? new Date().getFullYear();
    filters.push(`year>=${start}`);
    filters.push(`year<=${end}`);
  }

  if (publicationType) {
    filters.push(`publicationTypes:${publicationType}`);
  }

  if (filters.length > 0) {
    url.searchParams.set('filter', filters.join(','));
  }

  return url.toString();
}

export async function POST(request: Request) {
  try {
    const { query, startYear, endYear, publicationType } = (await request.json()) as {
      query?: string;
      startYear?: string;
      endYear?: string;
      publicationType?: string;
    };

    if (!query || !query.trim()) {
      return NextResponse.json(
        { error: 'Query is required.' },
        { status: 400 }
      );
    }

    const startYearNumber = startYear ? Number.parseInt(startYear, 10) : undefined;
    const endYearNumber = endYear ? Number.parseInt(endYear, 10) : undefined;
    const sanitizedPublicationType = publicationType?.trim();

    const apiUrl = buildQueryURL({
      query: query.trim(),
      startYear: Number.isFinite(startYearNumber) ? startYearNumber : undefined,
      endYear: Number.isFinite(endYearNumber) ? endYearNumber : undefined,
      publicationType: sanitizedPublicationType ? sanitizedPublicationType : undefined,
    });

    const response = await fetch(apiUrl, {
      headers: {
        Accept: 'application/json',
      },
      next: {
        revalidate: 60 * 5,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Semantic Scholar request failed', response.status, text);
      return NextResponse.json(
        { error: 'Failed to retrieve research papers.' },
        { status: 502 }
      );
    }

    const data = (await response.json()) as SearchResponse;

    return NextResponse.json({
      papers: data.data,
      total: data.total,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Unexpected server error.' },
      { status: 500 }
    );
  }
}
