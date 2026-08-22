import { Label } from '@/presentation/components/ui/label';
import { Button } from '@/presentation/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/presentation/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/presentation/components/ui/tooltip';
import type { Imagen } from '@/domain/entities/productos';
import Webcam from 'react-webcam';
import { ensureUnder1MB, dataURLToFile } from '@/infrastructure/services/image.service';
import { useRef, useState } from 'react';
import { Upload, Camera, Trash2 } from 'lucide-react';

export interface Step4Props {
  data: { perfil?: { file?: File | null; url?: string }; galeria: Imagen[] };
  setPerfil: (file: File | undefined) => void;
  addGaleria: (files: FileList | null) => void;
  removeGaleria: (i: number) => void | Promise<void>;
}

export default function Step4Imagenes({ data, setPerfil, addGaleria, removeGaleria }: Step4Props) {
  const webcamRef = useRef<Webcam | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('environment');
  const [cameraMode, setCameraMode] = useState<'perfil' | 'galeria' | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoConstraints: MediaTrackConstraints = {
    facingMode: cameraFacing,
  };


  function nowStamp(): string {
    const d = new Date();
    const pad = (v: number) => String(v).padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  }

  function openCamera(mode: 'perfil' | 'galeria'): void {
    setCameraMode(mode);
    setCameraOpen(true);
    setCameraError(null);
  }

  function closeCamera(): void {
    setCameraOpen(false);
    setCameraMode(null);
    setCameraError(null);
  }

  function toggleFacing(): void {
    setCameraFacing(prev => (prev === 'environment' ? 'user' : 'environment'));
  }

  async function handleCapture(): Promise<void> {
    const screenshot = webcamRef.current?.getScreenshot();
    if (!screenshot) {
      setCameraError('No se pudo capturar la imagen. Verifique permisos y vuelva a intentar.');
      return;
    }
    const file = dataURLToFile(screenshot, `captura-${nowStamp()}.jpg`);

    if (cameraMode === 'perfil') {
      const resized = await ensureUnder1MB(file);
      setPerfil(resized);
    } else if (cameraMode === 'galeria') {
      // Crear un FileList a partir del File usando DataTransfer
      const dt = new DataTransfer();
      const resized = await ensureUnder1MB(file);
      dt.items.add(resized);
      addGaleria(dt.files);
    }
    closeCamera();
  }

  return (
    <div>
      {/* <div className="bg-secondary border border-border rounded p-3">
        <div className="text-sm font-semibold text-foreground">Paso 4: Imágenes</div>
        <div className="text-xs text-muted-foreground">Agrega la foto de perfil y las imágenes de la galería</div>
      </div> */}
      <div className="grid grid-cols-1 lg:grid-cols-1">
        <div className="space-y-2">
          <div className="relative space-y-2">
            <div>
              {/* <p className="text-base font-semibold mb-2">Foto de producto</p> */}
              <div className="flex gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="button" variant="outline" size="icon" className="relative overflow-hidden">
                      <Upload className="w-4 h-4" />
                      <input type="file" accept="image/*" onChange={async e => {
                                          const f = e.target.files?.[0];
                                          if (!f) { setPerfil(undefined); return; }
                                          const resized = await ensureUnder1MB(f);
                                          setPerfil(resized);
                                        }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Seleccionar archivo</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="button" size="icon" variant="outline" onClick={() => openCamera('perfil')}>
                      <Camera className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Usar cámara</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {data.perfil?.url ? (
              <div className="mt-3 flex flex-col items-center space-y-3 text-center">
                <div className="relative inline-block">
                  <img src={data.perfil.url} alt="Perfil del producto" className="w-40 h-40 object-cover rounded-md border shadow-sm" />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button type="button" size="icon" variant="destructive" className="absolute -top-2 -right-2 rounded-full w-6 h-6 p-0 h-6 w-6" onClick={() => setPerfil(undefined)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Eliminar imagen</TooltipContent>
                  </Tooltip>
                </div>
                <div className="text-sm text-gray-600">Imagen actual del producto</div>
              </div>
            ) : data.perfil?.file ? (
              <div className="mt-3 flex flex-col items-center space-y-3 text-center">
                <div className="relative inline-block">
                  <img src={URL.createObjectURL(data.perfil.file)} alt="Vista previa" className="w-48 h-48 object-cover rounded-md border shadow-sm" />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button type="button" size="icon" variant="destructive" className="absolute -top-2 -right-2 rounded-full w-6 h-6 p-0" onClick={() => setPerfil(undefined)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Eliminar imagen</TooltipContent>
                  </Tooltip>
                </div>
                <div className="text-sm text-gray-600">Nueva imagen seleccionada</div>
              </div>
            ) : (
              <div className="mt-3 flex flex-col items-center gap-3 text-center">
                <div className="w-40 h-40 rounded-md border-2 border-dashed border-border flex items-center justify-center text-gray-400 bg-secondary/50">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <div className="text-xs text-muted-foreground">
                  {/*Selecciona una imagen o usa la cámara — PNG, JPG, GIF hasta 4MB*/}
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Modal de Cámara */}
        <Dialog open={cameraOpen} onOpenChange={closeCamera}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Cámara {cameraMode === 'perfil' ? '— Foto de Perfil' : '— Galería'}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {cameraError && (
                <div className="text-xs text-red-600 bg-red-50 p-2 rounded">{cameraError}</div>
              )}

              <div className="w-full flex justify-center">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoConstraints={videoConstraints}
                  onUserMediaError={() => setCameraError('No se pudo acceder a la cámara. Verifique permisos del navegador.')}
                  className="rounded-md border max-h-[60vh] w-full"
                />
              </div>

              <div className="flex justify-center gap-3">
                <Button type="button" variant="outline" onClick={toggleFacing}>Cambiar cámara</Button>
                <Button type="button" onClick={handleCapture}>Capturar</Button>
              </div>

              <div className="text-[11px] text-muted-foreground text-center">
                Nota: En móviles, para usar la cámara trasera seleccione "Cambiar cámara". Es posible que se requiera HTTPS y conceder permisos.
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* GALERÍA DE IMÁGENES */}
        {/* <div className="space-y-4 mt-6 pt-6 border-t border-border">
          <div>
            <p className="text-base font-semibold mb-2">Galería de imágenes</p>
            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="outline" size="icon" className="relative overflow-hidden">
                    <Upload className="w-4 h-4" />
                    <input type="file" multiple accept="image/*" onChange={async e => {
                                        const files = e.target.files;
                                        if (files) {
                                          const resizedFiles = new DataTransfer();
                                          for (let i = 0; i < files.length; i++) {
                                            const resized = await ensureUnder1MB(files[i]);
                                            resizedFiles.items.add(resized);
                                          }
                                          addGaleria(resizedFiles.files);
                                        }
                                      }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Seleccionar archivo(s)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" size="icon" variant="outline" onClick={() => openCamera('galeria')}>
                    <Camera className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Usar cámara</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {data.galeria && data.galeria.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {data.galeria.map((img, index) => (
                <div key={index} className="relative group">
                  <img
                    src={img.url || (typeof img.file !== 'string' ? URL.createObjectURL(img.file) : img.file)}
                    alt={`Galería ${index + 1}`}
                    className="w-full aspect-square object-cover rounded-md border"
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="absolute -top-2 -right-2 rounded-full w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeGaleria(index)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Eliminar imagen</TooltipContent>
                  </Tooltip>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 border-2 border-dashed border-border rounded-md bg-secondary/30">
              <p className="text-sm text-muted-foreground">No hay imágenes en la galería</p>
            </div>
          )}
        </div> */}
      </div>
    </div>
  );
}
