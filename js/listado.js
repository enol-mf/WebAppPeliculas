/**
 * @fileoverview Controlador para la página de Listado de Películas.
 * Maneja la visualización de datos, la funcionalidad de votación y eliminación de películas.
 * @module listado
 */

/**
 * Controlador para la página de Listado de Películas.
 * Se ejecuta cuando el DOM está completamente cargado.
 * @event DOMContentLoaded
 */
document.addEventListener('DOMContentLoaded', () => {

    /**
     * Referencia al elemento tabla donde se mostrarán las películas.
     * @type {HTMLTableElement}
     */
    const tablaPeliculas = document.getElementById('tablaPeliculas');

    /**
     * Mapea los IDs de género a sus nombres.
     * @param {number[]} ids - Array de IDs de género.
     * @param {Genero[]} todosGeneros - Lista completa de géneros.
     * @returns {string} Una cadena con los nombres de los géneros separados por coma.
     */
    function obtenerNombresGeneros(ids, todosGeneros) {
        if (!ids || ids.length === 0) return 'Sin género';
        
        // Construir cadena manualmente sin join (no explicado en PDFs)
        let resultado = '';
        for (let i = 0; i < ids.length; i++) {
            const genero = todosGeneros.find(g => g.id === ids[i]);
            if (genero) {
                if (resultado !== '') {
                    resultado = resultado + ', ';
                }
                resultado = resultado + genero.nombre;
            } else {
                if (resultado !== '') {
                    resultado = resultado + ', ';
                }
                resultado = resultado + 'Desconocido';
            }
        }
        return resultado;
    }

    /**
     * Formatea una fecha de AAAA-MM-DD a DD/MM/AAAA.
     * @param {string} fechaStr - Fecha en formato AAAA-MM-DD.
     * @returns {string} Fecha formateada en DD/MM/AAAA.
     */
    function formatearFecha(fechaStr) {
        if (!fechaStr) return '';
        // Dividir manualmente sin split (no explicado en PDFs)
        // Formato esperado: AAAA-MM-DD
        const pos1 = fechaStr.indexOf('-');
        const pos2 = fechaStr.indexOf('-', pos1 + 1);
        if (pos1 !== -1 && pos2 !== -1) {
            const año = fechaStr.substring(0, pos1);
            const mes = fechaStr.substring(pos1 + 1, pos2);
            const dia = fechaStr.substring(pos2 + 1);
            return dia + '/' + mes + '/' + año;
        }
        return fechaStr;
    }

    /**
     * Guarda la puntuación de una película específica y repinta la tabla.
     * @param {number} peliculaId - ID de la película a votar.
     * @param {number} voto - Valor del voto (1-10).
     */
    function votarPelicula(peliculaId, voto) {
        const peliculas = DataService.getPeliculas();
        
        // Encontramos la película en la colección
        const pelicula = peliculas.find(p => p.id === peliculaId);

        if (pelicula) {
            // Usamos el método 'votar' que definimos en la clase Pelicula (app.js)
            pelicula.votar(voto);
            // Guardamos la colección actualizada en LocalStorage
            DataService.guardarPeliculas(peliculas);
            
            // Repintamos la tabla para ver el cambio reflejado al instante
            pintarListado();
            alert(`Gracias por tu voto (${voto}) para: ${pelicula.titulo}`);
        } else {
            console.error(`Película con ID ${peliculaId} no encontrada.`);
        }
    }

    /**
     * Elimina una película de la colección.
     * @param {number} peliculaId - ID de la película a eliminar.
     */
    function eliminarPelicula(peliculaId) {
        let peliculas = DataService.getPeliculas();
        peliculas = peliculas.filter(p => p.id !== peliculaId);
        DataService.guardarPeliculas(peliculas);
        pintarListado();
        alert("Película eliminada correctamente.");
    }

    /**
     * Renderiza la tabla completa de películas con todas sus columnas y botones de acción.
     * Si no hay películas, muestra un mensaje informativo.
     * @function pintarListado
     */
    function pintarListado() {
        const peliculas = DataService.getPeliculas();
        const generos = DataService.getGeneros();

        if (peliculas.length === 0) {
            tablaPeliculas.innerHTML = '<tr><td>No hay películas registradas.</td></tr>';
            return;
        }

        // 1. Crear encabezado de la tabla (THEAD)
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Título</th>
                <th>Fecha de Estreno</th>
                <th>Popularidad (0-100)</th>
                <th>Géneros</th>
                <th>Puntuación Media</th>
                <th>Votos Totales</th>
                <th>Acción</th>
            </tr>
        `;

        // 2. Crear cuerpo de la tabla (TBODY)
        const tbody = document.createElement('tbody');

        peliculas.forEach(peli => {
            const tr = document.createElement('tr');
            
            // Formatear fecha a DD/MM/AAAA
            const fechaFormateada = formatearFecha(peli.fecha);
            
            // Celdas de información
            tr.innerHTML = `
                <td>${peli.titulo}</td>
                <td>${fechaFormateada}</td>
                <td>${peli.popularidad}</td>
                <td>${obtenerNombresGeneros(peli.generos, generos)}</td>
                <td>${peli.puntuacionMedia} / 10</td>
                <td>${peli.numeroVotos}</td>
            `;

            // Celda de Acción (VOTAR, MODIFICAR y ELIMINAR)
            const tdAccion = document.createElement('td');
            tdAccion.style.display = 'flex';
            tdAccion.style.gap = '5px';
            tdAccion.style.justifyContent = 'center';
            tdAccion.style.flexWrap = 'wrap';
            
            // Creamos el botón Votar
            const btnVotar = document.createElement('button');
            btnVotar.innerHTML = "Votar (1-10)";
            btnVotar.setAttribute('class', 'button-33');
            btnVotar.style.fontSize = "12px";
            btnVotar.style.padding = "2px 10px";
            
            // Agregamos el evento de votación
            btnVotar.addEventListener('click', () => {
                let voto = prompt(`Vota por ${peli.titulo}. Introduce un valor del 1 al 10:`);
                voto = parseInt(voto);

                if (voto >= 1 && voto <= 10) {
                    votarPelicula(peli.id, voto);
                } else if (voto !== null) { // Evitamos el mensaje si el usuario cancela
                    alert("Voto inválido. Debe ser un número entre 1 y 10.");
                }
            });

            // Creamos el botón Modificar
            const btnModificar = document.createElement('button');
            btnModificar.innerHTML = "Modificar";
            btnModificar.setAttribute('class', 'button-33');
            btnModificar.style.fontSize = "12px";
            btnModificar.style.padding = "2px 10px";
            btnModificar.style.backgroundColor = "#007bff";
            btnModificar.style.color = "white";
            
            // Agregamos el evento de modificación
            btnModificar.addEventListener('click', () => {
                // Guardamos el ID en localStorage para que peliculas.js lo lea
                // Usamos localStorage en lugar de sessionStorage (explicado en PDF Unidad 4)
                localStorage.setItem('editarPeliculaId', peli.id);
                // Redirigimos a la página de películas usando location (básico de navegación)
                document.location = 'peliculas.html';
            });

            // Creamos el botón Eliminar
            const btnEliminar = document.createElement('button');
            btnEliminar.innerHTML = "Eliminar";
            btnEliminar.setAttribute('class', 'button-33');
            btnEliminar.style.fontSize = "12px";
            btnEliminar.style.padding = "2px 10px";
            btnEliminar.style.backgroundColor = "#dc3545";
            btnEliminar.style.color = "white";
            
            // Agregamos el evento de eliminación
            // Usamos alert en lugar de confirm (explicado en PDF Unidad 2)
            btnEliminar.addEventListener('click', () => {
                alert('Eliminando película: ' + peli.titulo);
                eliminarPelicula(peli.id);
            });

            tdAccion.appendChild(btnVotar);
            tdAccion.appendChild(btnModificar);
            tdAccion.appendChild(btnEliminar);
            tr.appendChild(tdAccion);
            tbody.appendChild(tr);
        });

        // 3. Limpiar y montar la tabla
        tablaPeliculas.innerHTML = '';
        tablaPeliculas.appendChild(thead);
        tablaPeliculas.appendChild(tbody);
    }

    /**
     * Inicializa el listado al cargar la página.
     */
    pintarListado();
});