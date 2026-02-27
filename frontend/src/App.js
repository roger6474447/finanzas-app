import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

// Registrar componentes de Chart.js
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement);

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function App() {
  const [view, setView] = useState('dashboard');
  const [transacciones, setTransacciones] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [dashboard, setDashboard] = useState({ total_ingresos: 0, total_gastos: 0, balance: 0 });
  const [gastosCategoria, setGastosCategoria] = useState([]);
  const [ingresosCategoria, setIngresosCategoria] = useState([]);
  const [tendencia, setTendencia] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    descripcion: '',
    monto: '',
    categoria_id: '',
    tipo: 'gasto',
    fecha: new Date().toISOString().split('T')[0],
    metodo_pago: '',
    notas: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [transRes, catRes, dashRes, gastosRes, ingresosRes, tendRes] = await Promise.all([
        axios.get(`${API_URL}/transacciones`),
        axios.get(`${API_URL}/categorias`),
        axios.get(`${API_URL}/dashboard/resumen`),
        axios.get(`${API_URL}/dashboard/gastos-por-categoria`),
        axios.get(`${API_URL}/dashboard/ingresos-por-categoria`),
        axios.get(`${API_URL}/dashboard/tendencia`)
      ]);
      setTransacciones(transRes.data);
      setCategorias(catRes.data);
      setDashboard(dashRes.data);
      setGastosCategoria(gastosRes.data);
      setIngresosCategoria(ingresosRes.data);
      setTendencia(tendRes.data);
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${API_URL}/transacciones/${editingId}`, form);
      } else {
        await axios.post(`${API_URL}/transacciones`, form);
      }
      setModalOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error guardando:', error);
    }
  };

  const handleEdit = (transaccion) => {
    setForm({
      descripcion: transaccion.descripcion,
      monto: transaccion.monto,
      categoria_id: transaccion.categoria_id,
      tipo: transaccion.tipo,
      fecha: transaccion.fecha,
      metodo_pago: transaccion.metodo_pago || '',
      notas: transaccion.notas || ''
    });
    setEditingId(transaccion.id);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta transacción?')) {
      try {
        await axios.delete(`${API_URL}/transacciones/${id}`);
        loadData();
      } catch (error) {
        console.error('Error eliminando:', error);
      }
    }
  };

  const resetForm = () => {
    setForm({
      descripcion: '',
      monto: '',
      categoria_id: '',
      tipo: 'gasto',
      fecha: new Date().toISOString().split('T')[0],
      metodo_pago: '',
      notas: ''
    });
    setEditingId(null);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(amount);
  };

  const filteredCategorias = categorias.filter(c => c.tipo === form.tipo);

  // Datos para gráficos
  const gastosChartData = {
    labels: gastosCategoria.map(c => `${c.icono} ${c.nombre}`),
    datasets: [{
      data: gastosCategoria.map(c => c.total),
      backgroundColor: ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899'],
    }]
  };

  const tendenciaChartData = {
    labels: tendencia.map(t => t.mes),
    datasets: [
      {
        label: 'Ingresos',
        data: tendencia.map(t => t.ingresos),
        backgroundColor: '#22C55E'
      },
      {
        label: 'Gastos',
        data: tendencia.map(t => t.gastos),
        backgroundColor: '#EF4444'
      }
    ]
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">💰 Finanzas Personales</h1>
          <nav className="flex gap-4">
            <button onClick={() => setView('dashboard')} className={`px-4 py-2 rounded ${view === 'dashboard' ? 'bg-white text-blue-600' : 'hover:bg-blue-700'}`}>Dashboard</button>
            <button onClick={() => setView('transacciones')} className={`px-4 py-2 rounded ${view === 'transacciones' ? 'bg-white text-blue-600' : 'hover:bg-blue-700'}`}>Transacciones</button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto p-4">
        {/* Dashboard View */}
        {view === 'dashboard' && (
          <div className="space-y-6">
            {/* Tarjetas de resumen */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card bg-green-50 border-l-4 border-green-500">
                <p className="text-gray-600">Total Ingresos</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(dashboard.total_ingresos)}</p>
              </div>
              <div className="card bg-red-50 border-l-4 border-red-500">
                <p className="text-gray-600">Total Gastos</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(dashboard.total_gastos)}</p>
              </div>
              <div className={`card border-l-4 ${dashboard.balance >= 0 ? 'bg-blue-50 border-blue-500' : 'bg-yellow-50 border-yellow-500'}`}>
                <p className="text-gray-600">Balance</p>
                <p className={`text-2xl font-bold ${dashboard.balance >= 0 ? 'text-blue-600' : 'text-yellow-600'}`}>{formatCurrency(dashboard.balance)}</p>
              </div>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">📊 Gastos por Categoría</h3>
                {gastosCategoria.length > 0 ? (
                  <div className="h-64">
                    <Doughnut data={gastosChartData} options={{ maintainAspectRatio: false }} />
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No hay gastos registrados</p>
                )}
              </div>
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">📈 Tendencia (Últimos 6 meses)</h3>
                {tendencia.length > 0 ? (
                  <div className="h-64">
                    <Bar data={tendenciaChartData} options={{ maintainAspectRatio: false }} />
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No hay datos suficientes</p>
                )}
              </div>
            </div>

            {/* Lista de última transacciones */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">📋 Últimas Transacciones</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 text-left">Fecha</th>
                      <th className="p-3 text-left">Descripción</th>
                      <th className="p-3 text-left">Categoría</th>
                      <th className="p-3 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transacciones.slice(0, 5).map(t => (
                      <tr key={t.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">{t.fecha}</td>
                        <td className="p-3">{t.descripcion}</td>
                        <td className="p-3">{t.categoria_nombre}</td>
                        <td className={`p-3 text-right font-medium ${t.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}>
                          {t.tipo === 'ingreso' ? '+' : '-'}{formatCurrency(t.monto)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Transacciones View */}
        {view === 'transacciones' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">📋 Transacciones</h2>
              <button onClick={() => { resetForm(); setModalOpen(true); }} className="btn btn-primary">➕ Nueva Transacción</button>
            </div>

            <div className="card overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 text-left">Fecha</th>
                    <th className="p-3 text-left">Descripción</th>
                    <th className="p-3 text-left">Categoría</th>
                    <th className="p-3 text-left">Método</th>
                    <th className="p-3 text-right">Monto</th>
                    <th className="p-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {transacciones.map(t => (
                    <tr key={t.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">{t.fecha}</td>
                      <td className="p-3">{t.descripcion}</td>
                      <td className="p-3">
                        <span className={`badge ${t.tipo === 'ingreso' ? 'badge-ingreso' : 'badge-gasto'}`}>
                          {t.categoria_nombre}
                        </span>
                      </td>
                      <td className="p-3 text-gray-500">{t.metodo_pago || '-'}</td>
                      <td className={`p-3 text-right font-bold ${t.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}>
                        {t.tipo === 'ingreso' ? '+' : '-'}{formatCurrency(t.monto)}
                      </td>
                      <td className="p-3 text-center">
                        <button onClick={() => handleEdit(t)} className="text-blue-600 hover:text-blue-800 mr-2">✏️</button>
                        <button onClick={() => handleDelete(t.id)} className="text-red-600 hover:text-red-800">🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {transacciones.length === 0 && (
                <p className="text-center text-gray-500 py-8">No hay transacciones registradas</p>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Editar' : 'Nueva'} Transacción</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setForm({ ...form, tipo: 'gasto', categoria_id: '' })} className={`flex-1 py-2 rounded-lg ${form.tipo === 'gasto' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}>Gasto</button>
                  <button type="button" onClick={() => setForm({ ...form, tipo: 'ingreso', categoria_id: '' })} className={`flex-1 py-2 rounded-lg ${form.tipo === 'ingreso' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}>Ingreso</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <input type="text" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} className="input" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Monto</label>
                <input type="number" step="0.01" value={form.monto} onChange={e => setForm({ ...form, monto: e.target.value })} className="input" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Categoría</label>
                <select value={form.categoria_id} onChange={e => setForm({ ...form, categoria_id: e.target.value })} className="input" required>
                  <option value="">Seleccionar...</option>
                  {filteredCategorias.map(c => (
                    <option key={c.id} value={c.id}>{c.icono} {c.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fecha</label>
                <input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} className="input" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Método de Pago</label>
                <select value={form.metodo_pago} onChange={e => setForm({ ...form, metodo_pago: e.target.value })} className="input">
                  <option value="">Seleccionar...</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Tarjeta Débito">Tarjeta Débito</option>
                  <option value="Tarjeta Crédito">Tarjeta Crédito</option>
                  <option value="QR">QR</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notas</label>
                <textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} className="input" rows="2"></textarea>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn btn-primary flex-1">Guardar</button>
                <button type="button" onClick={() => { setModalOpen(false); resetForm(); }} className="btn bg-gray-300 hover:bg-gray-400 flex-1">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
