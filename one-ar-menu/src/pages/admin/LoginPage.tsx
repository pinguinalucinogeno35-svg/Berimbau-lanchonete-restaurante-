import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, Link } from 'react-router';
import { LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Notice';
import { TextInput } from '@/components/admin/Form';
import { useAuth } from '@/features/authentication/AuthProvider';

export default function LoginPage() {
  const auth = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const destino = (location.state as { from?: string } | null)?.from ?? '/admin';

  if (auth.status === 'signed-in') return <Navigate to={destino} replace />;

  const desabilitado = auth.status === 'unconfigured';
  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await auth.signIn(email.trim(), senha);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível entrar.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="grid min-h-dvh place-items-center bg-bg px-5 py-12">
      <form
        onSubmit={enviar}
        className="flex w-full max-w-sm flex-col gap-5 rounded-sm border border-line bg-bg-alt p-6"
        noValidate
      >
        <div className="flex items-center gap-3">
          <LockKeyhole className="size-5 text-accent" aria-hidden="true" />
          <h1 className="text-3xl">Acesso ao painel</h1>
        </div>
        {desabilitado && (
          <Notice tone="warning" title="Modo demonstrativo">
            O painel administrativo exige o Supabase configurado (VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY).
            Nada é salvo neste modo.
          </Notice>
        )}
        {erro && <Notice tone="error">{erro}</Notice>}
        <TextInput
          label="E-mail"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={desabilitado}
        />
        <TextInput
          label="Senha"
          type="password"
          autoComplete="current-password"
          required
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          disabled={desabilitado}
        />
        <Button type="submit" disabled={desabilitado || enviando || !email || !senha}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </Button>
        <Link to="/" className="text-center text-xs text-muted hover:text-text">
          Voltar ao cardápio
        </Link>
      </form>
    </div>
  );
}
