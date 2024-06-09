import React, { useState, useEffect } from 'react';
import { TailSpin } from 'react-loader-spinner';
import './App.css'; 

const Web = () => {
  const [datos, setDatos] = useState({});
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [opcionesTabla, setOpcionesTabla] = useState({});

 // Establece el estado de las tablas al inicio del programa
useEffect(() => {
  const tablasDisponibles = ['datos', 'canva', 'linkedin']; //Declara las 3 tablas disponibles
  const valorTablaInicio = {}; // Guarda el estado inicial de las tablas disponibles
  tablasDisponibles.forEach(table => {
    valorTablaInicio[table] = false; // Declara el valor inicial de las distintas tablas es decir FALSE
  });
  setOpcionesTabla(valorTablaInicio); // Establece el estado inicial de las opciones de tabla
}, []);

// Función para pedir datos del servidor
const pedirDatos = async () => {
  setLoading(true); // Muestra el icono de carga mientras se buscan los datos

  const tablasSelecionadas = Object.entries(opcionesTabla)
    .filter(([_, selecion]) => selecion) // Seleciona las tablas que estan con el valor TRUE es decir que estan selecionadas
    .map(([nombreTabla, _]) => nombreTabla); // Extrae los nombres de las tablas seleccionadas

  try {
    // Pone cada tabla seleccionada a una promesa que realiza una solicitud fetch
    const fetchPromises = tablasSelecionadas.map(async table => {
      // Construye los parámetros de la query según la tabla
      const queryParametros = new URLSearchParams({
        tables: table,
        firstName: table === 'datos' ? firstName : '', 
        lastName: table === 'datos' ? lastName : '', 
        email: (table === 'canva' || table === 'linkedin') ? email : ''
      }).toString();

      // Realiza la solicitud al servidor
      const respuesta = await fetch(`http://localhost:3001/datos?${queryParametros}`);
      if (!respuesta.ok) {
        throw new Error('Respuesta incorrecta'); // Lanza un error si la respuesta no es correcta
      }
      const resultado = await respuesta.json(); // Convierte los resultados en un JSON para hacer mas facil el tratamiento de los datos
      return { table, resultado }; // Devuelve el nombre de la tabla y el contenido encontrado
    });

    // Espera a que todas las promesas se resuelvan
    const resultados = await Promise.all(fetchPromises);
    const finalDatos = {};
    resultados.forEach(({ table, resultado }) => {
      finalDatos[table] = resultado[table]; // Junta todas las respuestan en una 
    });

    setDatos(finalDatos); // Actualiza el estado de los datos con los nuevos datos encontrados
  } catch (error) {
    console.error('Error obteniendo datos:', error); // Si hay un error con los datos se muestra
  } finally {
    setLoading(false); //Una vez encontrados los datos se quita el icono de busqueda
  }
};

  /*Se assigan la funcion pedirDatos que es la encargada de la busqueda a una nueva funcion que se llama funcionBusqueda y esto nos va a servir para assignar esta nueva funcion al click del boton de busqueda*/
  const funcionBusqueda = () => {
    pedirDatos();
  };

  //Funcion para descargar datos en .txt
  const descargarDatos = (item, index, nombreTabla) => {
    const textDatos = Object.entries(item).map(([key, value]) => {
      return `${nombresCampos[key] || 'Otros'}: ${value}`;
    }).join('\n');
    //Establece un nombre al archivo y verifica si hay mas nombres iguales para añadir un numero
    let fileName = `${item.firstName || item.PROFILE_FIRST_NAME || ''}_${item.lastName || item.PROFILE_LAST_NAME || ''}`.replace(/ /g, '_');
    const sameNameCount = datos[nombreTabla].filter((_, i) => i < index && `${datos[nombreTabla][i].firstName || datos[nombreTabla][i].PROFILE_FIRST_NAME || ''}_${datos[nombreTabla][i].lastName || datos[nombreTabla][i].PROFILE_LAST_NAME || ''}`.replace(/ /g, '_') === fileName).length;
    if (sameNameCount > 0) {
      fileName += `_${sameNameCount + 1}`;
    }
    //Se añade el .txt al final de nombre del archivo
    fileName += '.txt';

    const blob = new Blob([textDatos], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  };
/*Lo que hace esta funcion es cambiar el estado de opcionesTabla, llama a la funcion setOpcionesTabla que hemos visto antes que nos sirve para cambiar el estado del boleano,
esta funcion sirve principalmente para assignarla a las casillas de las distintas tablas y que estas se añadan a la peticion*/
  const cambiarOpcionesTabla = (nombreTabla) => {
    setOpcionesTabla({
      ...opcionesTabla,
      [nombreTabla]: !opcionesTabla[nombreTabla]
    });
  };

  const nombresTablas = {
    // Cambiar el nombre de las bases de datos a nombres personalizados para las casillas
    datos: 'Facebook',
    canva: 'Canva',
    linkedin: 'LinkedIn',
  };

  const nombresCampos = {
    // Cambiar el nombre del camppo por nombre personalizado

    //FACEBOOK
    firstName: 'Nombre',
    lastName: 'Apellidos',
    gender: 'Género',
    phoneNumber: 'Número de Teléfono',
    birthCity: 'Ciudad de Nacimiento',
    residenceCity: 'Ciudad',
    year: 'Otros',
    idNumber: 'ID',
    source: 'Tabla',
    //LINKEDIN
    PROFILE_KEY: 'Clave ID',
    PROFILE_USERNAMES: 'Nombre de Usuario',
    PROFILE_FIRST_NAME: 'Nombre',
    PROFILE_LAST_NAME: 'Apellido',
    PROFILE_COMPANY_NAME: 'Nombre de la Compañía',
    PROFILE_POSITION_TITLE: 'Título de la Posición',
    PROFILE_POSITION_LOCATION: 'Ubicación',
    //CANVA
    id: 'ID de Usuario',
    id_hash:'ID del hash',
    create_date:'Data de Creacion',
    mail:'Email',
    phone:'Numero de Telefono',
    mail_status:'Estado del Mail',
    username:'Nombre de Usuario',
    display_name:'Nombre',
    city:'Ciudad',
    country_code:'Codigo del Pais'

  };

  return (
    /*Esta parte contiene todo lo relacionado con la parte de la busqueda despues se hace otro div con la classe input-group,
    para hacer referencia al css y al "formulario" de busqueda de la pagina Web, el placeholder nos indica que dentro de la casilla donde vamos a escribir el nombre de busqueda haba escrito 
    First Name, despues el value={firstName} asigan el valor que se introduzca en esta casilla con el valor {firstName} que nos sirve para la peticion, el onChange lo que hace es actualizar la variable 
    firstName cada vez que haya un cambio en esta un vaor dentro del campo para tener el resultado actualizado, por ultimo se le asigan una nueva classe llama search-input para el css, con el apellido y elmail es el mismo proceso.*/
    <div className="container">
      <h1>Search Data</h1>
      <div className="input-group">
        <input
          type="text"
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="search-input"
        />
        <input
          type="text"
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="search-input"
        />
        <input
          type="text"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="search-input"
        />
        {/* Tenemos el boton de busqueda este lo que hace es que al clicar-lo llama a la funcion funcionBusqueda que antes hemos explicado */}
        <button onClick={funcionBusqueda} className="search-button">Search</button>
      </div>
       {/* Despues tenemos el TailSpin no es nada mas que lo que muestra
    el icono de loading con el estilo y el texto quee se muestra al lado, este solo se va a mostrat donde le hayamos dicho en las funciones especificas*/}
      {loading ? (
        <div className="loading-container">
          <TailSpin color="#00BFFF" height={80} width={80} />
          <p>Loading...</p>
        </div>
      ) : (
        <>{/*Aquí lo que se hace es iteerar sobre nombreTabla para separar las tireaciones por tabla en la base de datos 
        porque despues se va a indicar de que tabla proviene cada infromacio  que se muestra en la Web*/}
          {Object.keys(datos).map(nombreTabla => (
            <div key={nombreTabla}>
              <h2>{nombresTablas[nombreTabla] || nombreTabla}</h2>
              <ul>
            {/*Aqui lo que se hace es iterar sobre cada elemento de la array datos mediante el .map y por cada item dentro de datos se crea un etiqueta li haceindo que si hay mas de una respuesta queden
            separadas*/}
                {datos[nombreTabla] && datos[nombreTabla].length > 0 ? (
                  datos[nombreTabla].map((item, index) => (
                    <li key={index} className={`result-${nombreTabla.toLowerCase()}`}>
                {/*Aqui lo que se hace es convertir el objeto item en una array de parejas que llevan una key y un valor, por cada pareja se crea un div que contiene la key que es substituida por el valor
                que esta indicado en el mapeo que hemos hecho antes y esta esta en negrita gràcias a las etiquetas <strong> y despues el valor que le corresponde que ya va vinculado a la key*/}
                      {Object.entries(item).map(([key, value]) => (
                        <div key={key}>
                          <strong>{nombresCampos[key] || 'Otros'}:</strong> {value}
                        </div>
                      ))}
                      {/*Aqui lo que se hace es llamar a la funcion de descargarDatos que lo que hace es que al dar click a este boton se descarge el archivo .txt con la informacion de la peticion hecha*/}
                      <button onClick={() => descargarDatos(item, index, nombreTabla)} className="download-button">Download as TXT</button>
                    </li>
                  ))
                ) : (
                  <p>No se encontraron resultados para {nombresTablas[nombreTabla] || nombreTabla}</p>
                )}
              </ul>
            </div>
          ))}
        </>
      )}
      <div>
        {/* Renderizar las opciones de tabla */}
        {Object.keys(opcionesTabla).map(nombreTabla => (
          <div key={nombreTabla}>
            <input type="checkbox" checked={opcionesTabla[nombreTabla]} onChange={() => cambiarOpcionesTabla(nombreTabla)} />
            <label>{nombresTablas[nombreTabla] || nombreTabla}</label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Web;
