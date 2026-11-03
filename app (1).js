// Importación de módulos y configuración inicial
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(express.static('public')); // Servir archivos estáticos si los hay

// Base de datos en memoria (Simulación)
let transactions = [
    { id: 1, type: 'income', category: 'Sueldo', amount: 250000, date: '2026-11-01', description: 'Cobro de haberes' },
    { id: 2, type: 'expense', category: 'Supermercado', amount: 45000, date: '2026-11-02', description: 'Compras mensuales' },
    { id: 3, type: 'expense', category: 'Servicios', amount: 12000, date: '2026-11-03', description: 'Pago de luz' }
];

// -------------------------------------------------------------
// RUTAS DE LA API (REST API)
// -------------------------------------------------------------

// 1. Obtener todas las transacciones o filtrar por tipo (income/expense)
app.get('/api/transactions', (req, res) => {
    const { type } = req.query;
    if (type) {
        const filtered = transactions.filter(t => t.type === type);
        return res.json(filtered);
    }
    res.json(transactions);
});

// 2. Obtener resumen financiero (Balance, Total Ingresos, Total Gastos)
app.get('/api/summary', (req, res) => {
    const income = transactions
        .filter(t => t.type === 'income')
        .reduce((acc, curr) => acc + curr.amount, 0);

    const expense = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, curr) => acc + curr.amount, 0);

    const balance = income - expense;

    res.json({
        totalIncome: income,
        totalExpense: expense,
        balance: balance
    });
});

// 3. Crear una nueva transacción
app.post('/api/transactions', (req, res) => {
    const { type, category, amount, description } = req.body;

    if (!type || !amount || !category) {
        return res.status(400).json({ error: 'Faltan campos obligatorios (type, category, amount)' });
    }

    const newTransaction = {
        id: transactions.length ? transactions[transactions.length - 1].id + 1 : 1,
        type, // 'income' o 'expense'
        category,
        amount: Number(amount),
        date: new Date().toISOString().split('T')[0],
        description: description || ''
    };

    transactions.push(newTransaction);
    res.status(201).json(newTransaction);
});

// 4. Eliminar una transacción por ID
app.delete('/api/transactions/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = transactions.findIndex(t => t.id === id);

    if (index === -1) {
        return res.status(404).json({ error: 'Transacción no encontrada' });
    }

    const deleted = transactions.splice(index, 1);
    res.json({ message: 'Transacción eliminada exitosamente', deleted: deleted[0] });
});

// Ruta principal de salud / check
app.get('/', (req, res) => {
    res.send('<h1>API de Finanzas Personales lista y funcionando 🚀</h1>');
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
