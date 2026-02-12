import { Imgs } from "../core/services/imgs";



export class ImageLoader {
  constructor(private imagenFuntionsService$: Imgs) {}

  public loadImage(
    nameImg: string,
    adminConsul: boolean,
    callback: (imageUrl: string) => void
  ) {
    this.imagenFuntionsService$[adminConsul ? 'getAdminImg' : 'getImg'](
      nameImg
    ).subscribe((response: Blob) => {
      const reader = new FileReader();
      reader.onload = () => {
        const imageUrl = reader.result as string;
        callback(imageUrl);
      };
      reader.readAsDataURL(response);
    });
  }
}
