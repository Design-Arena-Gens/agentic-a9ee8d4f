import SearchForm from '@/app/components/SearchForm';

export default function Page() {
  return (
    <main>
      <header>
        <h1>Drug Development Research Explorer</h1>
        <p className="lead">
          Discover peer-reviewed literature across the drug development lifecycle. Use targeted filters to
          surface compounds, modalities, and trials advancing from discovery to approval.
        </p>
      </header>
      <SearchForm />
    </main>
  );
}
