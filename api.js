const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const odooUrl = 'http://ec2-3-139-233-173.us-east-2.compute.amazonaws.com:8069/jsonrpc'; // Asegúrate de que esta es la URL correcta de tu servidor Odoo
const db = 'odoo17'; // Nombre de la base de datos
const username = 'odoo17';
const password = 'odoo17';

// Función para obtener el UID del usuario en Odoo
async function getOdooUid() {
    const response = await axios.post(odooUrl, {
        jsonrpc: "2.0",
        method: "call",
        params: {
            service: "common",
            method: "login",
            args: [db, username, password],
        },
        id: new Date().getTime()
    });
    return response.data.result; // Retorna el UID
}

app.get('/api/parents', async (req, res) => {
    try {
        const uid = await getOdooUid();
        const response = await axios.post(odooUrl, {
            jsonrpc: "2.0",
            method: "call",
            params: {
                service: "object",
                method: "execute_kw",
                args: [
                    db, uid, password,
                    'res.users', 'search_read',
                    [],
                    { fields: ['email', 'mobile'] }
                ],
            },
            id: new Date().getTime()
        });
        res.json(response.data.result);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});




const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});



