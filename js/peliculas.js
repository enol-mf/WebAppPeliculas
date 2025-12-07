/**
 * @fileoverview Controlador para la gestión de Películas.
 * Maneja el formulario de creación de películas y la carga de géneros como checkboxes.
 * @module peliculas
 */

/**
 * Controlador para la gestión de Películas (Admin).
 * Se ejecuta cuando el DOM está completamente cargado.
 * @event DOMContentLoaded
 */
document.addEventListener('DOMContentLoaded', () => {

    /**
     * Referencias a elementos del DOM.
     * @type {HTMLFormElement}
     */
    const form = document.getElementById('formPeliculas');
    /**
     * @type {HTMLInputElement}
     */
    const inputNombre = document.getElementById('Nombre');
    /**
     * @type {HTMLInputElement}
     */
    const inputFecha = document.getElementById('fecha');
    /**
     * @type {HTMLInputElement}
     */
    const inputPopularidad = document.getElementById('Popularidad');
    /**
     * @type {HTMLElement}
     */
    const contenedorGeneros = document.getElementById('listaGeneros');
    /**
     * @type {HTMLInputElement}
     */
    const inputId = document.getElementById('idPelicula');
    /**
     * @type {HTMLButtonElement}
     */
    const btnSubmit = document.getElementById('btnSubmitPelicula');
    /**
     * @type {HTMLButtonElement}
     */
    const btnCancelar = document.getElementById('btnCancelarPelicula');
    
    /**
     * ID de la película que se está editando (null si no se está editando).
     * @type {number|null}
     */
    let peliculaEditando = null;

    /**
     * Carga los géneros disponibles como checkboxes en el formulario.
     * Si no hay géneros, muestra un mensaje informativo.
     * @function cargarGenerosFormulario
     */
    function cargarGenerosFormulario() {
        const generos = DataService.getGeneros();
        contenedorGeneros.innerHTML = ''; // Limpiar

        if (generos.length === 0) {
            contenedorGeneros.innerHTML = '<p>No hay géneros. Crea uno primero.</p>';
            return;
        }

        generos.forEach(g => {
            // Creamos un contenedor para checkbox + etiqueta
            const div = document.createElement('div');
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = g.id;
            checkbox.id = `gen-${g.id}`;
            checkbox.name = 'generos'; // Útil para agrupar

            const label = document.createElement('label');
            label.setAttribute('for', `gen-${g.id}`);
            label.innerHTML = g.nombre;
            label.style.marginLeft = "5px";

            div.appendChild(checkbox);
            div.appendChild(label);
            contenedorGeneros.appendChild(div);
        });
    }

    /**
     * Maneja el evento de agregar o modificar una película.
     * Valida todos los campos y crea o modifica la película si todo es correcto.
     * @function agregarPelicula
     * @param {Event} e - Evento del formulario.
     */
    function agregarPelicula(e) {
        e.preventDefault();

        // Eliminar espacios al inicio y final manualmente (sin trim)
        let titulo = inputNombre.value;
        // Eliminar espacios al inicio
        while (titulo.length > 0 && titulo.charAt(0) === ' ') {
            titulo = titulo.substring(1);
        }
        // Eliminar espacios al final
        while (titulo.length > 0 && titulo.charAt(titulo.length - 1) === ' ') {
            titulo = titulo.substring(0, titulo.length - 1);
        }
        const fechaStr = inputFecha.value;
        const popularidad = parseInt(inputPopularidad.value);

        // --- VALIDACIONES (Según PDF) ---
        
        // a) Validar campos obligatorios básicos
        if (!titulo || !fechaStr || isNaN(popularidad)) {
            alert("Por favor, rellena todos los campos.");
            return;
        }

        // Validar longitud del título
        if (titulo.length > 100) {
            alert("El título no puede superar los 100 caracteres.");
            return;
        }

        // b) Validar Fecha: Ni anterior a 1900 ni posterior a hoy 
        const fechaIngresada = new Date(fechaStr);
        const fechaMinima = new Date('1900-01-01');
        const fechaHoy = new Date();

        if (fechaIngresada < fechaMinima) {
            alert("La fecha no puede ser anterior al 01/01/1900.");
            return;
        }
        // Comparar solo año, mes y día (sin horas)
        const añoIngresado = fechaIngresada.getFullYear();
        const mesIngresado = fechaIngresada.getMonth();
        const diaIngresado = fechaIngresada.getDate();
        const añoHoy = fechaHoy.getFullYear();
        const mesHoy = fechaHoy.getMonth();
        const diaHoy = fechaHoy.getDate();
        
        if (añoIngresado > añoHoy || 
            (añoIngresado === añoHoy && mesIngresado > mesHoy) ||
            (añoIngresado === añoHoy && mesIngresado === mesHoy && diaIngresado > diaHoy)) {
            alert("La fecha no puede ser futura.");
            return;
        }

        // c) Validar Popularidad (0-100) 
        if (popularidad < 0 || popularidad > 100) {
            alert("La popularidad debe estar entre 0 y 100.");
            return;
        }

        // d) Obtener géneros seleccionados
        const checkboxes = contenedorGeneros.querySelectorAll('input[type="checkbox"]');
        const generosSeleccionados = [];
        // Convertir NodeList a Array manualmente (sin Array.from)
        for (let i = 0; i < checkboxes.length; i++) {
            if (checkboxes[i].checked) {
                generosSeleccionados.push(parseInt(checkboxes[i].value));
            }
        }

        if (generosSeleccionados.length === 0) {
            alert("Selecciona al menos un género.");
            return;
        }

        const peliculas = DataService.getPeliculas();

        // Si estamos editando
        if (peliculaEditando !== null) {
            const pelicula = peliculas.find(p => p.id === peliculaEditando);
            if (pelicula) {
                pelicula.titulo = titulo;
                pelicula.fecha = fechaStr;
                pelicula.popularidad = popularidad;
                pelicula.generos = generosSeleccionados;
                DataService.guardarPeliculas(peliculas);
                cancelarEdicion();
                alert("Película modificada correctamente.");
            }
            return;
        }

        // Si estamos agregando
        const nuevoId = DataService.siguienteId(peliculas);

        const nuevaPelicula = new Pelicula(
            nuevoId, 
            titulo, 
            fechaStr, 
            popularidad, 
            generosSeleccionados
        );

        peliculas.push(nuevaPelicula);
        DataService.guardarPeliculas(peliculas);

        // Resetear formulario
        form.reset();
        inputId.value = '';
        alert("Película agregada correctamente.");
    }

    /**
     * Inicia la edición de una película.
     * @param {number} id - ID de la película a editar.
     */
    function editarPelicula(id) {
        const peliculas = DataService.getPeliculas();
        const pelicula = peliculas.find(p => p.id === id);
        
        if (pelicula) {
            peliculaEditando = id;
            inputId.value = pelicula.id;
            inputNombre.value = pelicula.titulo;
            inputFecha.value = pelicula.fecha;
            inputPopularidad.value = pelicula.popularidad;
            
            // Marcar los géneros de la película
            const checkboxes = contenedorGeneros.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(cb => {
                const valorId = parseInt(cb.value);
                // Usar indexOf en lugar de includes (explicado en PDF Unidad 3)
                let encontrado = false;
                for (let i = 0; i < pelicula.generos.length; i++) {
                    if (pelicula.generos[i] === valorId) {
                        encontrado = true;
                        break;
                    }
                }
                cb.checked = encontrado;
            });
            
            btnSubmit.value = "Modificar";
            btnCancelar.style.display = "inline-block";
            inputNombre.focus();
        }
    }

    /**
     * Cancela la edición y restaura el formulario al modo agregar.
     */
    function cancelarEdicion() {
        peliculaEditando = null;
        inputId.value = '';
        form.reset();
        btnSubmit.value = "Agregar";
        btnCancelar.style.display = "none";
        
        // Desmarcar todos los checkboxes
        const checkboxes = contenedorGeneros.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = false);
    }

    // --- INICIALIZACIÓN ---
    /**
     * Event listener para el envío del formulario.
     */
    form.addEventListener('submit', agregarPelicula);

    /**
     * Event listener para cancelar la edición.
     */
    btnCancelar.addEventListener('click', () => {
        cancelarEdicion();
    });
    
    /**
     * Carga inicial de géneros al cargar la página.
     */
    cargarGenerosFormulario();

    /**
     * Si hay una película para editar (desde localStorage), la carga.
     * Usamos localStorage en lugar de sessionStorage (explicado en PDF Unidad 4).
     */
    const peliculaIdEditar = localStorage.getItem('editarPeliculaId');
    if (peliculaIdEditar) {
        editarPelicula(parseInt(peliculaIdEditar));
        localStorage.removeItem('editarPeliculaId');
    }
});