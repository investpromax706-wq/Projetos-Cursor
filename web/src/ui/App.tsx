import React, { useEffect, useMemo, useState } from 'react';
import './styles.css';

type User = { id: number; name: string; email: string; role: string };

type ApiClient = {
	get: (path: string) => Promise<any>;
	post: (path: string, body: any) => Promise<any>;
	put: (path: string, body: any) => Promise<any>;
	delete: (path: string) => Promise<any>;
};

function createApiClient(token: string | null): ApiClient {
	const base = import.meta.env.VITE_API_URL || 'http://localhost:3001';
	async function request(method: string, path: string, body?: any) {
		const res = await fetch(base + path, {
			method,
			headers: {
				'Content-Type': 'application/json',
				...(token ? { Authorization: `Bearer ${token}` } : {})
			},
			body: body ? JSON.stringify(body) : undefined
		});
		const json = await res.json().catch(() => ({}));
		if (!res.ok) {
			throw new Error(json.error || `Erro ${res.status}`);
		}
		return json;
	}
	return {
		get: (p) => request('GET', p),
		post: (p, b) => request('POST', p, b),
		put: (p, b) => request('PUT', p, b),
		delete: (p) => request('DELETE', p)
	};
}

function useLocalStorage(key: string, initial: string | null) {
	const [value, setValue] = useState<string | null>(() => localStorage.getItem(key) || initial);
	useEffect(() => {
		if (value === null) localStorage.removeItem(key);
		else localStorage.setItem(key, value);
	}, [key, value]);
	return [value, setValue] as const;
}

function Section(props: { title: string; children: React.ReactNode }) {
	return (
		<section style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 16 }}>
			<h3 style={{ marginTop: 0 }}>{props.title}</h3>
			{props.children}
		</section>
	);
}

export function App() {
	const [token, setToken] = useLocalStorage('token', null);
	const api = useMemo(() => createApiClient(token), [token]);
	const [me, setMe] = useState<User | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		setMe(null);
		setError(null);
		if (!token) return;
		api.get('/me').then((r) => setMe(r.user)).catch((e) => setError(e.message));
	}, [token]);

	if (!token || !me) {
		return <Login onToken={setToken} />;
	}

	return (
		<div style={{ maxWidth: 1100, margin: '0 auto', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
			<header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
				<h2 style={{ margin: 0 }}>Barbearia – Gestão</h2>
				<div>
					<span style={{ marginRight: 12 }}>{me.name}</span>
					<button onClick={() => setToken(null)}>Sair</button>
				</div>
			</header>

			{error && <div style={{ color: 'crimson' }}>{error}</div>}

			<Dashboard api={api} />
			<Clients api={api} />
			<Appointments api={api} />
			<Inventory api={api} />
		</div>
	);
}

function Login({ onToken }: { onToken: (t: string) => void }) {
	const [email, setEmail] = useState('admin@barbearia.local');
	const [password, setPassword] = useState('admin123');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function submit(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);
		setError(null);
		try {
			const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password })
			});
			const json = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(json.error || 'Erro de login');
			onToken(json.token);
		} catch (err: any) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	}

	return (
		<div style={{ maxWidth: 420, margin: '10vh auto', padding: 24, border: '1px solid #e5e7eb', borderRadius: 8 }}>
			<h2>Entrar</h2>
			{error && <div style={{ color: 'crimson', marginBottom: 8 }}>{error}</div>}
			<form onSubmit={submit}>
				<div style={{ display: 'grid', gap: 8 }}>
					<label>Email
						<input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" />
					</label>
					<label>Senha
						<input value={password} onChange={(e) => setPassword(e.target.value)} required type="password" />
					</label>
					<button disabled={loading} type="submit">{loading ? 'Entrando...' : 'Entrar'}</button>
				</div>
			</form>
		</div>
	);
}

function Money({ cents }: { cents: number }) {
	return <span>{(cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>;
}

function Dashboard({ api }: { api: ApiClient }) {
	const [summary, setSummary] = useState<{ total_in: number; total_out: number; balance: number } | null>(null);
	useEffect(() => {
		api.get('/api/cash/summary').then(setSummary).catch(() => {});
	}, []);
	return (
		<Section title="Resumo de Caixa">
			{summary ? (
				<div style={{ display: 'flex', gap: 24 }}>
					<div>Entradas: <Money cents={summary.total_in} /></div>
					<div>Saídas: <Money cents={summary.total_out} /></div>
					<div>Saldo: <Money cents={summary.balance} /></div>
				</div>
			) : 'Carregando...'}
		</Section>
	);
}

function Clients({ api }: { api: ApiClient }) {
	const [list, setList] = useState<any[]>([]);
	const [name, setName] = useState('');
	const [phone, setPhone] = useState('');

	useEffect(() => { api.get('/api/clients').then(setList); }, []);

	async function add(e: React.FormEvent) {
		e.preventDefault();
		const created = await api.post('/api/clients', { name, phone });
		setList([created, ...list]);
		setName(''); setPhone('');
	}

	return (
		<Section title="Clientes">
			<form onSubmit={add} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
				<input placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} required />
				<input placeholder="Telefone" value={phone} onChange={(e) => setPhone(e.target.value)} />
				<button type="submit">Adicionar</button>
			</form>
			<div>
				{list.map(c => (
					<div key={c.id} style={{ padding: 8, borderBottom: '1px solid #eee' }}>
						<strong>{c.name}</strong> {c.phone ? `- ${c.phone}` : ''}
					</div>
				))}
			</div>
		</Section>
	);
}

function Appointments({ api }: { api: ApiClient }) {
	const [list, setList] = useState<any[]>([]);
	const [clients, setClients] = useState<any[]>([]);
	const [barbers, setBarbers] = useState<any[]>([]);
	const [services, setServices] = useState<any[]>([]);
	const [form, setForm] = useState<any>({});

	useEffect(() => {
		Promise.all([
			api.get('/api/appointments'),
			api.get('/api/clients'),
			api.get('/api/barbers'),
			api.get('/api/services')
		]).then(([apps, cls, bbs, svs]) => { setList(apps); setClients(cls); setBarbers(bbs); setServices(svs); });
	}, []);

	async function add(e: React.FormEvent) {
		e.preventDefault();
		const created = await api.post('/api/appointments', form);
		setList([created, ...list]);
		setForm({});
	}

	return (
		<Section title="Agenda">
			<form onSubmit={add} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
				<select value={form.client_id || ''} onChange={(e) => setForm({ ...form, client_id: Number(e.target.value) })} required>
					<option value="">Cliente</option>
					{clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
				</select>
				<select value={form.barber_id || ''} onChange={(e) => setForm({ ...form, barber_id: Number(e.target.value) })} required>
					<option value="">Barbeiro</option>
					{barbers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
				</select>
				<select value={form.service_id || ''} onChange={(e) => setForm({ ...form, service_id: Number(e.target.value) })} required>
					<option value="">Serviço</option>
					{services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
				</select>
				<input type="datetime-local" value={form.start_at || ''} onChange={(e) => setForm({ ...form, start_at: e.target.value })} required />
				<input type="datetime-local" value={form.end_at || ''} onChange={(e) => setForm({ ...form, end_at: e.target.value })} required />
				<button type="submit" style={{ gridColumn: 'span 5' }}>Agendar</button>
			</form>
			<div>
				{list.map(a => (
					<div key={a.id} style={{ padding: 8, borderBottom: '1px solid #eee', display: 'flex', gap: 8 }}>
						<div>#{a.id}</div>
						<div>{a.client_name || a.client_id}</div>
						<div>{a.barber_name || a.barber_id}</div>
						<div>{a.service_name || a.service_id}</div>
						<div>{a.start_at} → {a.end_at}</div>
						<div>{a.status}</div>
					</div>
				))}
			</div>
		</Section>
	);
}

function Inventory({ api }: { api: ApiClient }) {
	const [items, setItems] = useState<any[]>([]);
	const [name, setName] = useState('');
	const [stock, setStock] = useState('0');

	useEffect(() => { api.get('/api/inventory/items').then(setItems); }, []);

	async function add(e: React.FormEvent) {
		e.preventDefault();
		const created = await api.post('/api/inventory/items', { name, stock_qty: Number(stock) });
		setItems([created, ...items]);
		setName(''); setStock('0');
	}

	return (
		<Section title="Estoque">
			<form onSubmit={add} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
				<input placeholder="Item" value={name} onChange={(e) => setName(e.target.value)} required />
				<input type="number" step="0.01" placeholder="Qtd" value={stock} onChange={(e) => setStock(e.target.value)} />
				<button type="submit">Adicionar</button>
			</form>
			<div>
				{items.map(i => (
					<div key={i.id} style={{ padding: 8, borderBottom: '1px solid #eee', display: 'flex', gap: 8 }}>
						<div><strong>{i.name}</strong></div>
						<div>Estoque: {i.stock_qty}</div>
					</div>
				))}
			</div>
		</Section>
	);
}