
const express = require('express'); 
const mysql = require('mysql');
const cors = require('cors'); 

const app = express();
const port = 3001;
app.use(cors());

// Configuracion de la base de datos
const conexion = mysql.createConnection({
  host: 'localhost',
  user: 'enti',
  password: 'enti',
  database: 'leaks_db'
});

// Establece la conexion con la base de datos
conexion.connect((err) => {
  if (err) {
    // Muestra si hay errores con la conexion a la base de datos
    console.error('Error al conectarse a la base de datos:', err);
    return;
  }
  // Muestra si se ha establecido la conexion a la base de datos
  console.log('Conexión establecida');
});

// Establece la ruta GET en /datos para la peticion
app.get('/datos', (req, res) => {
  // Extrae los parametros que llegan desde la peticion
  const { firstName, lastName, email, tables } = req.query;

  //Mira las tablas que llegan de la peticion i si no hay tablas manda el error
  if (!tables) {
    res.status(400).json({ error: 'Opciones de Tabla no disponibles' });
    return;
  }

  // Verifica que tablasSelecionadas sea un array ya que despues se trabaja como array
  const tablasSelecionadas = Array.isArray(tables) ? tables : [tables];
  
  // Divide las peticiones por tablas para despues hacer una query por cada tabla
  const promises = tablasSelecionadas.map((tableName) => {
    let sql = ''; //Crea lo que sera la query
    const parametros = []; // Crea la array de parametros
    
    // Crea las diferentes querys por cada tabla que tenemos en la base de datos en este caso lo hace con LIKE para buscar con resultados similares
    if (tableName === 'canva') {
      sql = `SELECT *, '${tableName}' as source FROM ${tableName} WHERE mail LIKE ?`;
      parametros.push(`%${email}%`); 
    } else if (tableName === 'linkedin') {
      sql = `SELECT *, '${tableName}' as source FROM ${tableName} WHERE JSON_CONTAINS(PROFILE_USERNAMES, ?)`;
      parametros.push(`"${email}"`);
    } else if (tableName === 'datos') {
      sql = `SELECT *, '${tableName}' as source FROM ${tableName} WHERE 1`;
      if (firstName) {
        sql += ' AND firstName LIKE ?';
        parametros.push(`%${firstName}%`);
      }
      if (lastName) {
        sql += ' AND lastName LIKE ?';
        parametros.push(`%${lastName}%`);
      }
    }
    
    // Alternativa de búsqueda sin LIKE para mayor velocidad (descomentado)
    /*
    if (tableName === 'canva') {
      sql = `SELECT *, '${tableName}' as source FROM ${tableName} WHERE mail = ?`;
      parametros.push(email);
    } else if (tableName === 'linkedin') {
      sql = `SELECT *, '${tableName}' as source FROM ${tableName} WHERE JSON_CONTAINS(PROFILE_USERNAMES, ?)`;
      parametros.push(`"${email}"`); 
    } else if (tableName === 'datos') {
      sql = `SELECT *, '${tableName}' as source FROM ${tableName} WHERE 1 = 1`;
      if (firstName) {
        sql += ' AND firstName = ?';
        parametros.push(firstName);
      }
      if (lastName) {
        sql += ' AND lastName = ?';
        parametros.push(lastName);
      }
    }
    */

    //Crea una nueva promesa para las consultas SQL
    return new Promise((resolve, reject) => {
      conexion.query(sql, parametros, (err, resultados) => {
        if (err) {
          return reject(err); // La rechaza si hay algun error
        }
        resolve({ tableName, resultados }); // Y la resuelve si todo es correcto
      });
    });
  });

  // Espera todas las promesas echas es decir una por tabla en la base de datos
  Promise.all(promises)
    .then((resultados) => {
      const datos = {};
      // Junta todos los resultados de todas las tablas y las establece com nombre de tabla y resultado
      resultados.forEach(({ tableName, resultados }) => {
        datos[tableName] = resultados;
      });
      res.json(datos);
    })
    .catch((err) => {
      // Muestra si hay errores en las querys
      console.error('Error al hacer la query:', err);
      res.status(500).json({ error: 'Error al hacer la query' });
    });
});

// Inicia el servidor y escucha en el puerto establecido
app.listen(port, () => {
  console.log(`Servidor activo en http://localhost:${port}`);
});
