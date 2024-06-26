const express = require('express');
const axios = require('axios');
const admin = require('firebase-admin');
const app = express();

app.use(express.json());

const odooUrl = 'http://ec2-3-139-233-173.us-east-2.compute.amazonaws.com:8069/jsonrpc'; // Asegúrate de que esta es la URL correcta de tu servidor Odoo
const db = 'odoo17'; // Nombre de la base de datos
const username = 'odoo17';
const password = 'odoo17';

// Inicializar Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json'); // Reemplaza con la ruta correcta a tu archivo JSON de servicio de Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});



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

// Endpoint para obtener datos de 'op.parent'
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

///// Consigue los anuncios
app.get('/api/announcements', async (req, res) => {
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
                    'school.announcement', 'search_read',
                    [],
                    { fields: ['subject', 'content', 'date_created'] }
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

//// prueba de fees

///// Consigue los anuncios
app.get('/api/fis', async (req, res) => {
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
                    'op.academic.year', 'search_read',
                    [],
                    { fields: ['academic_term_ids'] }
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

// Nuevo endpoint para obtener los años académicos
app.get('/api/academic_years', async (req, res) => {
    try {
        const uid = await getOdooUid();
        console.log('UID:', uid);

        const academicYearsResponse = await axios.post(odooUrl, {
            jsonrpc: "2.0",
            method: "call",
            params: {
                service: "object",
                method: "execute_kw",
                args: [
                    db, uid, password,
                    'op.academic.year', 'search_read',
                    [],
                    { fields: ['id', 'name', 'academic_term_ids'] }
                ],
            },
            id: new Date().getTime()
        });

        console.log('Academic Years Response Data:', academicYearsResponse.data);

        if (academicYearsResponse.data.error) {
            console.error('Error en la consulta de academic years:', academicYearsResponse.data.error.message);
            return res.status(500).json({ success: false, message: 'Error en la consulta de academic years' });
        }

        res.json(academicYearsResponse.data.result);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Nuevo endpoint para obtener los términos académicos por año académico
app.get('/api/academic_terms', async (req, res) => {
    const { academic_year_id } = req.query;
    try {
        const uid = await getOdooUid();
        console.log('UID:', uid);
        console.log('Academic Year ID:', academic_year_id);

        const academicTermsResponse = await axios.post(odooUrl, {
            jsonrpc: "2.0",
            method: "call",
            params: {
                service: "object",
                method: "execute_kw",
                args: [
                    db, uid, password,
                    'op.academic.term', 'search_read',
                    [[['academic_year_id', '=', parseInt(academic_year_id)]]],
                    { fields: ['id', 'name', 'term_start_date', 'term_end_date', 'academic_year_id'] }
                ],
            },
            id: new Date().getTime()
        });

        console.log('Academic Terms Response Data:', academicTermsResponse.data);

        if (academicTermsResponse.data.error) {
            console.error('Error en la consulta de academic terms:', academicTermsResponse.data.error.message);
            return res.status(500).json({ success: false, message: 'Error en la consulta de academic terms' });
        }

        res.json(academicTermsResponse.data.result);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});




///// Consigue los fees
// Nuevo endpoint para obtener detalles de tarifas por mobile del padre
app.get('/api/feesdetails', async (req, res) => {
    const { mobile } = req.query;
    try {
        const uid = await getOdooUid();
        console.log('UID:', uid);
        console.log('Mobile:', mobile);

        // Obtener el ID del padre basado en el mobile
        const parentResponse = await axios.post(odooUrl, {
            jsonrpc: "2.0",
            method: "call",
            params: {
                service: "object",
                method: "execute_kw",
                args: [
                    db, uid, password,
                    'op.parent', 'search_read',
                    [[['mobile', '=', mobile]]],
                    { fields: ['id', 'student_ids'] }
                ],
            },
            id: new Date().getTime()
        });

        console.log('Parent Response Data:', parentResponse.data);

        if (parentResponse.data.error) {
            console.error('Error en la consulta de parent:', parentResponse.data.error.message);
            return res.status(500).json({ success: false, message: 'Error en la consulta de parent' });
        }

        if (!parentResponse.data.result || parentResponse.data.result.length === 0) {
            return res.status(404).json({ success: false, message: 'Parent not found' });
        }

        const parent = parentResponse.data.result[0];
        const studentIds = parent.student_ids;
        console.log('Student IDs:', studentIds);

        // Verifica que studentIds no esté vacío
        if (studentIds.length === 0) {
            return res.status(404).json({ success: false, message: 'No students found for this parent' });
        }

        // Obtener los detalles de las tarifas para los estudiantes relacionados
        const feesDetailsResponse = await axios.post(odooUrl, {
            jsonrpc: "2.0",
            method: "call",
            params: {
                service: "object",
                method: "execute_kw",
                args: [
                    db, uid, password,
                    'op.student.fees.details', 'search_read',
                    [[['student_id', 'in', studentIds]]],
                    { fields: ['fees_line_id', 'invoice_id', 'amount', 'date', 'product_id', 'student_id', 'fees_factor', 'state', 'invoice_state', 'company_id', 'after_discount_amount', 'discount', 'course_id', 'batch_id'] }
                ],
            },
            id: new Date().getTime()
        });

        console.log('Fees Details Response Data:', feesDetailsResponse.data);

        if (feesDetailsResponse.data.error) {
            console.error('Error en la consulta de fees details:', feesDetailsResponse.data.error.message);
            return res.status(500).json({ success: false, message: 'Error en la consulta de fees details' });
        }

        res.json(feesDetailsResponse.data.result);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});


/////endopoint para hijos de padres
app.get('/api/children', async (req, res) => {
    const { mobile } = req.query;
    try {
        const uid = await getOdooUid();
        console.log('UID:', uid);
        console.log('Mobile:', mobile);

        // Obtener el ID del padre basado en el mobile
        const parentResponse = await axios.post(odooUrl, {
            jsonrpc: "2.0",
            method: "call",
            params: {
                service: "object",
                method: "execute_kw",
                args: [
                    db, uid, password,
                    'op.parent', 'search_read',
                    [[['mobile', '=', mobile]]],
                    { fields: ['id', 'student_ids'] }
                ],
            },
            id: new Date().getTime()
        });

        console.log('Parent Response Data:', parentResponse.data);

        if (parentResponse.data.error) {
            console.error('Error en la consulta de parent:', parentResponse.data.error.message);
            return res.status(500).json({ success: false, message: 'Error en la consulta de parent' });
        }

        if (!parentResponse.data.result || parentResponse.data.result.length === 0) {
            return res.status(404).json({ success: false, message: 'Parent not found' });
        }

        const parent = parentResponse.data.result[0];
        const studentIds = parent.student_ids;
        console.log('Student IDs:', studentIds);

        // Verifica que studentIds no esté vacío
        if (studentIds.length === 0) {
            return res.status(404).json({ success: false, message: 'No students found for this parent' });
        }

        // Obtener los detalles de los estudiantes
        const studentsResponse = await axios.post(odooUrl, {
            jsonrpc: "2.0",
            method: "call",
            params: {
                service: "object",
                method: "execute_kw",
                args: [
                    db, uid, password,
                    'op.student', 'search_read',
                    [[['id', 'in', studentIds]]],
                    { fields: ['name', 'id'] } // Asegúrate de que 'image_url' es un campo válido en 'op.student'
                ],
            },
            id: new Date().getTime()
        });

        console.log('Students Response Data:', studentsResponse.data);

        if (studentsResponse.data.error) {
            console.error('Error en la consulta de students:', studentsResponse.data.error.message);
            return res.status(500).json({ success: false, message: 'Error en la consulta de students' });
        }

        res.json(studentsResponse.data.result);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});


// Nuevo endpoint para obtener las calificaciones de un estudiante por su ID
app.get('/api/studentgrades', async (req, res) => {
    const { student_id, academic_year_id, term_id } = req.query;
    try {
        const uid = await getOdooUid();
        console.log('UID:', uid);
        console.log('Student ID:', student_id);
        console.log('Academic Year ID:', academic_year_id);
        console.log('Term ID:', term_id);

        // Obtener las calificaciones del estudiante basado en su ID, academic_year_id y term_id
        const gradesResponse = await axios.post(odooUrl, {
            jsonrpc: "2.0",
            method: "call",
            params: {
                service: "object",
                method: "execute_kw",
                args: [
                    db, uid, password,
                    'student.grade', 'search_read',
                    [[
                        ['student_id', '=', parseInt(student_id)],
                        ['academic_term_id', '=', parseInt(term_id)]
                    ]],
                    { fields: ['student_id', 'batch_id', 'course_id', 'subject_id', 'grade', 'date', 'academic_term_id'] }
                ],
            },
            id: new Date().getTime()
        });

        console.log('Grades Response Data:', gradesResponse.data);

        if (gradesResponse.data.error) {
            console.error('Error en la consulta de grades:', gradesResponse.data.error.message);
            return res.status(500).json({ success: false, message: 'Error en la consulta de grades' });
        }

        res.json(gradesResponse.data.result);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});


// Nuevo endpoint para obtener las calificaciones de un estudiante por su ID
app.get('/api/studentsgrades', async (req, res) => {
    const { student_id } = req.query;
    try {
        const uid = await getOdooUid();
        console.log('UID:', uid);
        console.log('Student ID:', student_id);

        // Obtener las calificaciones del estudiante basado en su ID
        const gradesResponse = await axios.post(odooUrl, {
            jsonrpc: "2.0",
            method: "call",
            params: {
                service: "object",
                method: "execute_kw",
                args: [
                    db, uid, password,
                    'student.grade', 'search_read',
                    [[
                        ['student_id', '=', parseInt(student_id)]
                    ]],
                    { fields: ['student_id', 'batch_id', 'course_id', 'subject_id', 'grade', 'date', 'academic_term_id'] }
                ],
            },
            id: new Date().getTime()
        });

        console.log('Grades Response Data:', gradesResponse.data);

        if (gradesResponse.data.error) {
            console.error('Error en la consulta de grades:', gradesResponse.data.error.message);
            return res.status(500).json({ success: false, message: 'Error en la consulta de grades' });
        }

        res.json(gradesResponse.data.result);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});


// Nuevo endpoint para el login
app.post('/api/login', async (req, res) => {
    const { email, password: mobile } = req.body;
    try {
        const uid = await getOdooUid();
        console.log('UID:', uid);

        const response = await axios.post(odooUrl, {
            jsonrpc: "2.0",
            method: "call",
            params: {
                service: "object",
                method: "execute_kw",
                args: [
                    db, uid, password,
                    'res.users', 'search_read',
                    [[['email', '=', email], ['mobile', '=', mobile]]],
                    { fields: ['email', 'mobile'] }
                ],
            },
            id: new Date().getTime()
        });

        console.log('Response Data:', response.data);

        if (response.data && response.data.result && response.data.result.length > 0) {
            console.log('Login successful for email:', email);
            res.json({ success: true, message: 'Login successful' });
        } else {
            console.log('Invalid email or password for email:', email);
            res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});


// Verificar y enviar notificaciones push cada minuto
let lastCheckedDate = new Date(0); // Fecha inicial para comparar nuevos anuncios

async function checkAndSendNotifications() {
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
          'school.announcement', 'search_read',
          [],
          { fields: ['subject', 'content', 'date_created'] }
        ],
      },
      id: new Date().getTime()
    });
    const announcements = response.data.result;

    const newAnnouncements = announcements.filter(announcement => new Date(announcement.date_created) > lastCheckedDate);
    if (newAnnouncements.length > 0) {
      lastCheckedDate = new Date(newAnnouncements[newAnnouncements.length - 1].date_created); // Actualiza la fecha de la última verificación

      newAnnouncements.forEach(async (announcement) => {
        const message = {
          notification: {
            title: announcement.subject,
            body: announcement.content,
          },
          topic: 'all', // Puedes usar 'all' para enviar a todos o manejar tokens específicos
        };

        try {
          await admin.messaging().send(message);
          console.log('Successfully sent message:', announcement.subject);
        } catch (error) {
          console.error('Error sending message:', error);
        }
      });
    }
  } catch (error) {
    console.error('Error checking announcements:', error);
  }
}

setInterval(checkAndSendNotifications, 3000); // Verifica cada minuto

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
