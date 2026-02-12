import Swal, { SweetAlertOptions } from 'sweetalert2';

export const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  },
});

export const customOptions: SweetAlertOptions = {
  title: '',
  width: 600,
  imageUrl: '/images/registro.png',
  background: '#00000000',
  imageWidth: 600,
  timer: 50000,
  showConfirmButton: false,
  backdrop: `
    rgba(0,0,123,0.4)
    url("/images/login-min.png")
    top right
    no-repeat
  `,
  customClass: {
    container: 'my-swal-container',
  },
};
