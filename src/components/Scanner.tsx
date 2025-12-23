
import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, RefreshCw } from 'lucide-react';

interface ScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

const Scanner: React.FC<ScannerProps> = ({ onScanSuccess, onClose }) => {
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const qrCodeInstance = useRef<Html5Qrcode | null>(null);
  const scannerId = "qr-reader";

  useEffect(() => {
    let isMounted = true;

    const stopScanner = async () => {
      if (qrCodeInstance.current && qrCodeInstance.current.isScanning) {
        try {
          await qrCodeInstance.current.stop();
          qrCodeInstance.current.clear();
        } catch (err) {
          console.error("Camera Stop Error:", err);
        }
      }
    };

    const startScanner = async () => {
      try {
        if (!isMounted) return;
        setIsInitializing(true);
        setError(null);

        const element = document.getElementById(scannerId);
        if (!element) return;

        qrCodeInstance.current = new Html5Qrcode(scannerId);

        const config = {
          fps: 10,
          qrbox: { width: 280, height: 200 },
          aspectRatio: 1.0
        };

        // Try to get all cameras first for a more robust selection
        let cameras: any[] = [];
        try {
          cameras = await Html5Qrcode.getCameras();
        } catch (e) {
          console.warn("Could not list cameras, attempting direct facingMode start", e);
        }

        const onScan = (decodedText: string) => {
          if (isMounted) {
            stopScanner().then(() => onScanSuccess(decodedText));
          }
        };

        const onScanError = (errorMessage: string) => {
          // Ignore frequent framing errors
        };

        if (cameras && cameras.length > 0) {
          // Look for a back camera explicitly if possible
          const backCamera = cameras.find(cam => 
            cam.label.toLowerCase().includes('back') || 
            cam.label.toLowerCase().includes('rear') ||
            cam.label.toLowerCase().includes('environment')
          );
          
          const cameraId = backCamera ? backCamera.id : cameras[0].id;
          
          await qrCodeInstance.current.start(
            cameraId,
            config,
            onScan,
            onScanError
          );
        } else {
          // Fallback to generic facingMode if getCameras failed or returned empty
          await qrCodeInstance.current.start(
            { facingMode: "environment" },
            config,
            onScan,
            onScanError
          );
        }

        if (isMounted) setIsInitializing(false);
      } catch (err: any) {
        console.error("Camera Start Error Detail:", err);
        if (isMounted) {
          // If environment mode failed, try one last time with any camera
          if (err?.name === 'NotFoundError' || err?.message?.includes('Requested device not found')) {
            try {
              await qrCodeInstance.current?.start(
                { facingMode: "user" }, // Try front if back is "missing"
                { fps: 10, qrbox: { width: 280, height: 200 }, aspectRatio: 1.0 },
                (text) => { if (isMounted) { stopScanner().then(() => onScanSuccess(text)); } },
                () => {}
              );
              setIsInitializing(false);
              return;
            } catch (secondErr) {
              setError("未找到可用的摄像头设备。");
            }
          } else {
            setError(err?.message || "无法启动摄像头，请检查权限。");
          }
          setIsInitializing(false);
        }
      }
    };

    // Use a small timeout to ensure DOM is ready
    const timer = setTimeout(() => {
      if (!(window as any).Html5Qrcode) {
        const script = document.createElement('script');
        script.src = "https://unpkg.com/html5-qrcode";
        script.async = true;
        script.onload = () => {
          if (isMounted) startScanner().catch(console.error);
        };
        script.onerror = () => {
          if (isMounted) setError("扫码组件加载失败。");
        };
        document.head.appendChild(script);
      } else {
        startScanner().catch(console.error);
      }
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      stopScanner().catch(console.error);
    };
  }, [onScanSuccess]);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
      <div className="w-full h-full relative flex flex-col items-center justify-center">
        
        {/* Scanner Container */}
        <div id={scannerId} className="w-full max-w-md aspect-square bg-zinc-900 overflow-hidden relative border-y border-zinc-800">
           {isInitializing && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10">
                <RefreshCw className="text-pink-500 animate-spin mb-2" size={32} />
                <p className="text-zinc-500 text-xs font-black uppercase">Initializing Camera...</p>
             </div>
           )}
        </div>

        {/* Overlay Labels */}
        <div className="absolute top-12 left-0 right-0 text-center z-20">
          <h3 className="text-white font-black text-xl tracking-tighter drop-shadow-lg">SCAN BARCODE</h3>
          <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mt-1">Place the code inside the frame</p>
        </div>

        {/* UI Controls */}
        <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center px-10 space-y-6 z-20">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 p-4 rounded-2xl w-full text-center backdrop-blur-md">
              <p className="text-red-200 text-xs font-bold leading-tight">{error}</p>
            </div>
          )}
          
          <button 
            onClick={onClose}
            className="w-16 h-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform"
          >
            <X size={28} />
          </button>
        </div>

        {/* Visual Scan Frame Decorations */}
        <div className="absolute inset-0 pointer-events-none border-[40px] border-black/40">
           <div className="w-full h-full border-2 border-white/10 relative">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-pink-500 rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-pink-500 rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-purple-600 rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-purple-600 rounded-br-lg"></div>
              
              {/* Scanline Animation */}
              {!isInitializing && !error && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_rgba(34,211,238,0.8)] animate-scanline"></div>
              )}
           </div>
        </div>
      </div>

      <style>{`
        @keyframes scanline {
          0% { top: 0%; }
          100% { top: 100%; }
        }
        .animate-scanline {
          animation: scanline 3s linear infinite;
        }
        #qr-reader video {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
        }
      `}</style>
    </div>
  );
};

export default Scanner;
