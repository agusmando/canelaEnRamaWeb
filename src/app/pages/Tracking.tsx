import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { MessageCircle, PackageSearch, Search } from 'lucide-react';
import { useTrackShipmentQuery } from '../api/shopApi';
import { getErrorMessage } from '../api/client';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { EmptyState, ErrorState, Spinner } from '../components/States';
import { ShipmentDetails } from '../components/ShipmentTracking';
import { normalizeTrackingCode } from '../lib/shipments';
import { orderNumber } from '../lib/orders';
import { whatsappLink } from '../lib/contact';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

/** Seguimiento público de envíos: `/seguimiento` y `/seguimiento/:code`. */
export default function Tracking() {
  useDocumentTitle('Seguimiento de envío');
  const params = useParams();
  const code = normalizeTrackingCode(params.code ?? '');
  const navigate = useNavigate();
  const [input, setInput] = useState(code);
  useEffect(() => {
    setInput(code);
  }, [code]);

  const { data, isFetching, error, refetch } = useTrackShipmentQuery(code, { skip: !code });
  const status = (error as { status?: number } | undefined)?.status;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = normalizeTrackingCode(input);
    if (!next) return;
    if (next === code) refetch();
    else navigate(`/seguimiento/${encodeURIComponent(next)}`);
  };

  return (
    <div className="container-page">
      <Breadcrumbs items={[{ label: 'Seguimiento de envío' }]} />
      <div className="max-w-3xl">
        <h1 className="text-3xl font-semibold text-ink-800 sm:text-4xl">Seguí tu envío</h1>
        <p className="mt-3 text-ink-600 sm:text-lg">Ingresá el código de seguimiento que te enviamos (por ejemplo, CER-7X4K9P2Q).</p>

        <form onSubmit={submit} className="mt-6 flex flex-col gap-3 sm:flex-row" role="search" aria-label="Buscar envío">
          <label htmlFor="tracking-code" className="sr-only">
            Código de seguimiento
          </label>
          <div className="relative flex-1">
            <PackageSearch className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-ink-400" aria-hidden />
            <input
              id="tracking-code"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Código de seguimiento"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={40}
              className="field h-12 pl-11 font-mono text-[17px] tracking-wide uppercase placeholder:font-sans placeholder:tracking-normal placeholder:normal-case"
            />
          </div>
          <button type="submit" disabled={!normalizeTrackingCode(input) || isFetching} className="btn-primary h-12 px-6">
            {isFetching ? <Spinner className="size-4" /> : <Search className="size-4" />} Buscar
          </button>
        </form>
      </div>

      <div className="mt-8" aria-live="polite">
        {!code ? (
          <p className="text-sm text-ink-500">
            ¿Hiciste un pedido con tu cuenta? También podés ver el seguimiento desde{' '}
            <Link to="/mi-cuenta/pedidos" className="font-medium text-brand-500 hover:underline">
              Mis pedidos
            </Link>
            .
          </p>
        ) : isFetching && !data ? (
          <div className="skeleton h-72 rounded-xl" aria-label="Buscando envío" />
        ) : error ? (
          status === 404 ? (
            <EmptyState
              icon={<PackageSearch className="size-7" />}
              title="No encontramos un envío con ese código"
              className="rounded-xl border border-ink-200"
              action={
                <a href={whatsappLink(`Hola! No encuentro mi envío con el código ${code}`)} target="_blank" rel="noreferrer" className="btn-outline min-h-11 px-5 py-2 text-center whitespace-normal">
                  <MessageCircle className="size-4" /> Consultanos por WhatsApp
                </a>
              }
            >
              Revisá que esté bien escrito (letras y números, con el guion). Si el problema sigue, escribinos.
            </EmptyState>
          ) : (
            <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
          )
        ) : data ? (
          <div className="space-y-3">
            <p className="text-sm text-ink-500">Pedido {orderNumber(data.orderId)}</p>
            <ShipmentDetails data={data} title="Estado del envío" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
