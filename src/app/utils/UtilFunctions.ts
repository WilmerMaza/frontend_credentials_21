export const calcularEdad = (fechaNacimiento : string) => {
  let fechaNacimientoObj  = new Date(fechaNacimiento).getTime();
  let fechaActual = new Date().getTime();
  let diferencia = fechaActual - fechaNacimientoObj;
  return Math.floor(diferencia / (1000 * 60 * 60 * 24 * 365.25));
 
}