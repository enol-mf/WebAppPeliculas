/**
 * @fileoverview Controlador para la gestión de géneros.
 * Maneja el listado, alta y baja de géneros interactuando con el DOM y DataService.
 * @module generos
 */

/**
 * Controlador para la gestión de géneros.
 * Se ejecuta cuando el DOM está completamente cargado.
 * @event DOMContentLoaded
 */
document.addEventListener('DOMContentLoaded', () => {
    
    /**
     * Referencias a elementos del DOM.
     * @type {HTMLFormElement}
     */
    const form = document.getElementById('formGeneros');
    /**
     * @type {HTMLInputElement}
     */
    const inputNombre = document.getElementById('nuevoGenero');
    /**
     * @type {HTMLInputElement}
     */
    const inputId = document.getElementById('idGenero');
    /**
     * @type {HTMLElement}
     */
    const listaGeneros = document.getElementById('listaGenerosPagina');
    /**
     * @type {HTMLButtonElement}
     */
    const btnSubmit = document.getElementById('btnSubmitGenero');
    /**
     * @type {HTMLButtonElement}
     */
    const btnCancelar = document.getElementById('btnCancelarGenero');
    
    /**
     * ID del género que se está editando (null si no se está editando).
     * @type {number|null}
     */
    let generoEditando = null;

    /**
     * Renderiza la lista de géneros en el HTML.
     * Limpia la lista actual y la reconstruye desde el LocalStorage.
     */
    function pintarGeneros() {
        const generos = DataService.getGeneros();
        
        // Limpiamos la lista actual (innerHTML = "")
        listaGeneros.innerHTML = '';

        generos.forEach(genero => {
            // Creamos el elemento li
            const li = document.createElement('li');
            li.style.marginBottom = "10px"; // Un poco de estilo inline para separar
            
            // Texto del género: ID - Nombre
            const texto = document.createTextNode(`ID: ${genero.id} - ${genero.nombre} `);
            li.appendChild(texto);

            // Botón de modificar
            const btnModificar = document.createElement('button');
            btnModificar.innerHTML = "Modificar";
            btnModificar.style.marginLeft = "10px";
            btnModificar.setAttribute('class', 'button-33');
            btnModificar.style.fontSize = "12px";
            btnModificar.style.padding = "2px 10px";
            btnModificar.addEventListener('click', () => editarGenero(genero.id));

            // Botón de eliminar (Requisito CRUD)
            const btnBorrar = document.createElement('button');
            btnBorrar.innerHTML = "Eliminar";
            btnBorrar.style.marginLeft = "10px";
            btnBorrar.setAttribute('class', 'button-33');
            btnBorrar.style.fontSize = "12px";
            btnBorrar.style.padding = "2px 10px";
            btnBorrar.addEventListener('click', () => borrarGenero(genero.id));

            li.appendChild(btnModificar);
            li.appendChild(btnBorrar);
            listaGeneros.appendChild(li);
        });
    }

    /**
     * Maneja el evento de agregar o modificar un género.
     * @param {Event} e - Evento del formulario.
     */
    function agregarGenero(e) {
        e.preventDefault();

        // Eliminar espacios al inicio y final manualmente (sin trim)
        let nombre = inputNombre.value;
        // Eliminar espacios al inicio
        while (nombre.length > 0 && nombre.charAt(0) === ' ') {
            nombre = nombre.substring(1);
        }
        // Eliminar espacios al final
        while (nombre.length > 0 && nombre.charAt(nombre.length - 1) === ' ') {
            nombre = nombre.substring(0, nombre.length - 1);
        }

        // Validaciones según PDF
        if (nombre === "") {
            alert("El nombre no puede estar vacío.");
            return;
        }

        if (nombre.length > 100) {
            alert("El nombre no puede superar los 100 caracteres.");
            return;
        }

        const generos = DataService.getGeneros();

        // Si estamos editando
        if (generoEditando !== null) {
            const genero = generos.find(g => g.id === generoEditando);
            if (genero) {
                // Comprobar si el nuevo nombre ya existe (excepto el actual)
                // Comparación exacta sin toLowerCase (no explicado en PDFs)
                let existe = false;
                for (let i = 0; i < generos.length; i++) {
                    if (generos[i].id !== generoEditando && generos[i].nombre === nombre) {
                        existe = true;
                        break;
                    }
                }
                if (existe) {
                    alert("Este género ya existe.");
                    return;
                }
                genero.nombre = nombre;
                DataService.guardarGeneros(generos);
                cancelarEdicion();
                pintarGeneros();
                alert("Género modificado correctamente.");
            }
            return;
        }

        // Si estamos agregando
        // Comprobar si ya existe (comparación exacta)
        let existe = false;
        for (let i = 0; i < generos.length; i++) {
            if (generos[i].nombre === nombre) {
                existe = true;
                break;
            }
        }
        if (existe) {
            alert("Este género ya existe.");
            return;
        }

        // Generar ID autoincremental
        const nuevoId = DataService.siguienteId(generos);

        // Crear instancia y guardar
        const nuevoGenero = new Genero(nuevoId, nombre);
        generos.push(nuevoGenero);
        DataService.guardarGeneros(generos);

        // Limpiar input y repintar
        inputNombre.value = '';
        inputId.value = '';
        pintarGeneros();
    }

    /**
     * Inicia la edición de un género.
     * @param {number} id - ID del género a editar.
     */
    function editarGenero(id) {
        const generos = DataService.getGeneros();
        const genero = generos.find(g => g.id === id);
        
        if (genero) {
            generoEditando = id;
            inputId.value = genero.id;
            inputNombre.value = genero.nombre;
            btnSubmit.value = "Modificar";
            btnCancelar.style.display = "inline-block";
            inputNombre.focus();
        }
    }

    /**
     * Cancela la edición y restaura el formulario al modo agregar.
     */
    function cancelarEdicion() {
        generoEditando = null;
        inputId.value = '';
        inputNombre.value = '';
        btnSubmit.value = "Agregar";
        btnCancelar.style.display = "none";
    }

    /**
     * Elimina un género si no está siendo usado por ninguna película.
     * @param {number} id - ID del género a eliminar.
     */
    function borrarGenero(id) {
        // Validación de integridad referencial 
        const peliculas = DataService.getPeliculas();
        
        // Buscamos si alguna película tiene este ID en su array de 'generos'
        // Recordamos que en Pelicula guardamos un array de IDs (ej: [1, 2])
        // Usar indexOf en lugar de includes (explicado en PDF Unidad 3)
        let estaEnUso = false;
        for (let i = 0; i < peliculas.length; i++) {
            let encontrado = false;
            for (let j = 0; j < peliculas[i].generos.length; j++) {
                if (peliculas[i].generos[j] === id) {
                    encontrado = true;
                    break;
                }
            }
            if (encontrado) {
                estaEnUso = true;
                break;
            }
        }

        if (estaEnUso) {
            alert("No se puede eliminar el género: hay películas asociadas a él. Elimine primero el género de las películas.");
            return;
        }

        // Usamos alert en lugar de confirm (explicado en PDF Unidad 2)
        alert("Eliminando género");
        let generos = DataService.getGeneros();
        // Filtramos para quitar el que coincide con el ID
        generos = generos.filter(g => g.id !== id);
        
        DataService.guardarGeneros(generos);
        pintarGeneros();
    }

    // --- Inicialización ---
    
    /**
     * Event listener para el envío del formulario.
     */
    form.addEventListener('submit', agregarGenero);

    /**
     * Event listener para cancelar la edición.
     */
    btnCancelar.addEventListener('click', () => {
        cancelarEdicion();
    });

    /**
     * Pinta la lista inicial de géneros al cargar la página.
     */
    pintarGeneros();
});