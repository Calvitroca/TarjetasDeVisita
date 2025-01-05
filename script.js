$(document).ready(function () {
  const firebaseBaseUrl = "https://us-central1-tarjetasdevisita-2bc7f.cloudfunctions.net";

  // Función para verificar si el usuario existe
  const verificarUsuario = (telefono) => {
      return $.ajax({
          url: `${firebaseBaseUrl}/consultarEstado`,
          type: "POST",
          contentType: "application/json",
          data: JSON.stringify({ telefono }),
      });
  };

  // Función para registrar un nuevo usuario
  const registrarUsuario = (telefono, nombre, bebida) => {
      return $.ajax({
          url: `${firebaseBaseUrl}/registrarCliente`,
          type: "POST",
          contentType: "application/json",
          data: JSON.stringify({ telefono, nombre }),
      }).then(() => {
          return $.ajax({
              url: `${firebaseBaseUrl}/asignarBebida`,
              type: "POST",
              contentType: "application/json",
              data: JSON.stringify({ telefono, bebida }),
          });
      });
  };

  // Función para registrar una visita
  const registrarVisita = (telefono, bebida, visitasPrevias) => {
      return $.ajax({
          url: `${firebaseBaseUrl}/registrarVisita`,
          type: "POST",
          contentType: "application/json",
          data: JSON.stringify({ telefono, bebida }),
      })
          .done((response) => {
              const nuevasVisitas = visitasPrevias + 1;
              const mensaje =
                  nuevasVisitas >= 5
                      ? "¡Felicidades! Completaste tu tarjeta. Está lista para redimir."
                      : "Visita registrada.";
              const fechaHoy = new Date().toLocaleDateString();

              // Actualizar contenido del ticket
              $("#ticket-nombre").text($("#nombre-cliente").text());
              $("#ticket-bebida").text(bebida);
              $("#ticket-visitas").text(`${nuevasVisitas}/5`);
              $("#ticket-mensaje").text(mensaje);
              $("#ticket-fecha").text(fechaHoy);

              // Mostrar ticket y botón de imprimir
              $("#ticket").removeClass("hidden");
              $("#imprimir-ticket").removeClass("hidden").show();

              // Actualizar visitas en la interfaz
              $("#visitas").text(`${nuevasVisitas}/5`);

              // Mostrar mensaje de éxito en pantalla
              $("#resultado")
                  .text(`${mensaje} (${fechaHoy})`)
                  .removeClass("hidden alert-danger")
                  .addClass("alert-success");
          })
          .fail((jqXHR, textStatus) => {
              $("#resultado")
                  .text(`Error al registrar visita: ${textStatus}`)
                  .removeClass("hidden alert-success")
                  .addClass("alert-danger");
          });
  };

  // Función para redimir una tarjeta
  const redimirTarjeta = (telefono, bebida) => {
      return $.ajax({
          url: `${firebaseBaseUrl}/redimirTarjeta`,
          type: "POST",
          contentType: "application/json",
          data: JSON.stringify({ telefono, bebida }),
      })
          .done(() => {
              $("#resultado").text(`La tarjeta de ${bebida} ha sido redimida con éxito.`)
                  .removeClass("hidden alert-danger")
                  .addClass("alert-success");
              $("#opciones-tarjeta").addClass("hidden");
          })
          .fail((jqXHR, textStatus) => {
              $("#resultado").text(`Error al redimir tarjeta: ${textStatus}`)
                  .removeClass("hidden alert-success")
                  .addClass("alert-danger");
          });
  };

  // Función para guardar una tarjeta
  const guardarTarjeta = (telefono, bebida) => {
      return $.ajax({
          url: `${firebaseBaseUrl}/guardarTarjeta`,
          type: "POST",
          contentType: "application/json",
          data: JSON.stringify({ telefono, bebida }),
      })
          .done(() => {
              $("#resultado").text(`La tarjeta de ${bebida} ha sido guardada.`)
                  .removeClass("hidden alert-danger")
                  .addClass("alert-success");
              $("#opciones-tarjeta").addClass("hidden");
          })
          .fail((jqXHR, textStatus) => {
              $("#resultado").text(`Error al guardar tarjeta: ${textStatus}`)
                  .removeClass("hidden alert-success")
                  .addClass("alert-danger");
          });
  };

  // Botón para imprimir el ticket
  $("#imprimir-ticket").on("click", function () {
      window.print();
  });

  // Evento al verificar el número de teléfono
  $("#verificar-telefono").on("click", function () {
      const telefono = $("#telefono").val().trim();

      if (!telefono) {
          $("#resultado").text("Por favor, introduce un número de teléfono.")
              .removeClass("hidden alert-success")
              .addClass("alert-danger");
          return;
      }

      verificarUsuario(telefono)
          .done(function (usuario) {
              if (!usuario || usuario.activas.length === 0) {
                  $("#form-numero").addClass("hidden");
                  $("#form-nuevo-usuario").removeClass("hidden");
              } else {
                  if (usuario.nombre) {
                      $("#nombre-cliente").text(usuario.nombre);
                  } else {
                      $("#nombre-cliente").text("Nombre no disponible");
                  }

                  const tarjeta = usuario.activas[0];
                  const visitasPrevias = tarjeta ? tarjeta.visitas : 0;

                  $("#tarjeta-activa").text(tarjeta ? tarjeta.bebida : "Ninguna");
                  $("#visitas").text(`${visitasPrevias}/5`);

                  $("#form-numero").addClass("hidden");
                  $("#info-cliente").removeClass("hidden");

                  if (visitasPrevias >= 5) {
                      $("#opciones-tarjeta").removeClass("hidden");
                      $("#redimir-tarjeta").off("click").on("click", function () {
                          redimirTarjeta(telefono, tarjeta.bebida);
                      });

                      $("#guardar-tarjeta").off("click").on("click", function () {
                          guardarTarjeta(telefono, tarjeta.bebida);
                      });
                  } else if (tarjeta) {
                      registrarVisita(telefono, tarjeta.bebida, visitasPrevias);
                  }
              }
          })
          .fail(function (jqXHR, textStatus) {
              if (jqXHR.status === 404) {
                  $("#form-numero").addClass("hidden");
                  $("#form-nuevo-usuario").removeClass("hidden");
              } else {
                  $("#resultado").text(`Error al verificar usuario: ${textStatus}`)
                      .removeClass("hidden alert-success")
                      .addClass("alert-danger");
              }
          });
  });

  // Evento al registrar un nuevo usuario
  $("#registrar-usuario").on("click", function () {
      const telefono = $("#telefono").val().trim();
      const nombre = $("#nombre").val().trim();
      const bebida = $("#bebida").val().trim();

      if (!nombre || !bebida) {
          $("#resultado")
              .text("Por favor, completa todos los campos.")
              .removeClass("hidden alert-success")
              .addClass("alert-danger");
          return;
      }

      registrarUsuario(telefono, nombre, bebida)
          .done(function () {
              $("#resultado")
                  .text(`¡Bienvenido ${nombre}! Tu tarjeta de ${bebida} está activa.`)
                  .removeClass("hidden alert-danger")
                  .addClass("alert-success");

              $("#form-nuevo-usuario").addClass("hidden");
              $("#form-numero").removeClass("hidden");
              $("#telefono").val("");
          })
          .fail(function (jqXHR, textStatus) {
              $("#resultado")
                  .text(`Error al registrar usuario: ${textStatus}`)
                  .removeClass("hidden alert-success")
                  .addClass("alert-danger");
          });
  });

  // Botón para regresar al inicio
  $("#regresar").on("click", function () {
      $("#info-cliente").addClass("hidden");
      $("#form-nuevo-usuario").addClass("hidden");
      $("#form-numero").removeClass("hidden");
      $("#ticket").addClass("hidden");
      $("#telefono").val("");
      $("#resultado").addClass("hidden");
      $("#opciones-tarjeta").addClass("hidden");
  });
});