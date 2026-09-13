/*
 * Velsy · Encuentra tu servicio
 * booking-service.js — capa de integración de reservas.
 *
 * HOY: Velsy Marketplace no tiene un sistema de reservas propio. Este módulo es
 * el ÚNICO punto de la interfaz que sabrá "reservar" cuando exista integración
 * real con la agenda de la app (app.velsy.es). Mientras tanto, degrada de forma
 * honesta: si el profesional ya tiene reserva online habilitada, abre su enlace;
 * si no, ofrece contactar directamente (teléfono / email) sin fingir una reserva
 * que no existe.
 *
 * Integración futura esperada (ver README-MANTENIMIENTO.md):
 *   VelsyBooking.iniciarReserva({ professionalId, serviceId, employeeId, date, time, customer })
 *   devolverá una promesa que, en vez de abrir un enlace externo, llamará al
 * endpoint real de reservas de la app Velsy.
 */
(function (window) {
  'use strict';

  /**
   * @param {Object} params
   * @param {string} params.professionalId
   * @param {string} [params.serviceId]
   * @param {string} [params.employeeId]
   * @param {string} [params.date]
   * @param {string} [params.time]
   * @param {Object} [params.customer]
   * @param {Object} profesional  objeto completo del profesional (para saber si ya tiene reserva online)
   */
  function iniciarReserva(params, profesional) {
    window.Velsy && window.Velsy.track('click_booking', {
      professionalId: params.professionalId,
      serviceId: params.serviceId || null
    });

    if (profesional && profesional.reserva && profesional.reserva.habilitada && profesional.reserva.url) {
      var url = window.Velsy.safeUrl(profesional.reserva.url);
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
        return Promise.resolve({ status: 'redirected' });
      }
    }

    // Sin integración de reservas todavía: no se inventa una reserva, se ofrece contacto directo.
    return Promise.resolve({ status: 'not_available' });
  }

  window.VelsyBooking = {
    iniciarReserva: iniciarReserva
  };
})(window);
