"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { Camera, Upload, X, Loader2, Leaf, Globe, Sprout, Clock, Trees, ShieldAlert, SwitchCamera } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { handleIdentifyPlant } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import type { IdentifyPlantOutput } from "@/ai/flows/identify-plant";
import { Skeleton } from "@/components/ui/skeleton";

export function PlantIdentifier() {
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<IdentifyPlantOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Check for multiple cameras on mount
  useEffect(() => {
    const checkForMultipleCameras = async () => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
              console.log("enumerateDevices() not supported.");
              return;
            }
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            if (videoDevices.length > 1) {
                setHasMultipleCameras(true);
            }
        } catch (err) {
            console.error("Error enumerating devices:", err);
        }
    };
    checkForMultipleCameras();
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Handles initializing and cleaning up the camera stream
  useEffect(() => {
    if (!cameraActive) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      return;
    }

    let isCancelled = false;
    
    const initCamera = async () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      setCameraError(null);
      
      const constraints: MediaStreamConstraints = {
        video: { facingMode: { ideal: facingMode } }
      };

      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!isCancelled && videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          streamRef.current = stream;
        }
      } catch (err) {
        console.error("Error accessing camera with facingMode:", err);
        try {
            const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (!isCancelled && videoRef.current) {
              videoRef.current.srcObject = fallbackStream;
              videoRef.current.play();
              streamRef.current = fallbackStream;
            }
        } catch (fallbackErr) {
            console.error("Fallback camera access also failed:", fallbackErr);
            if (!isCancelled) {
              setCameraError("Could not access camera. Please check browser permissions.");
              setCameraActive(false);
            }
        }
      }
    };

    initCamera();

    return () => {
      isCancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [cameraActive, facingMode]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = useCallback(() => {
    setPreview(null);
    setResult(null);
    setCameraActive(true);
  }, []);
  
  const captureImage = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        toast({
            variant: "destructive",
            title: "Camera Not Ready",
            description: "Video feed is not available yet. Please wait a moment and try again.",
        });
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setPreview(dataUrl);
      }
      stopCamera();
    }
  }, [stopCamera, toast]);

  const handleSwitchCamera = () => {
    setFacingMode(prevMode => (prevMode === 'user' ? 'environment' : 'user'));
  };

  const handleSubmit = async () => {
    if (!preview) {
      toast({
        variant: "destructive",
        title: "No Image",
        description: "Please select an image or take a picture first.",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    const response = await handleIdentifyPlant(preview);

    if (response && 'error' in response) {
      toast({
        variant: "destructive",
        title: "Identification Failed",
        description: response.error,
      });
    } else {
      setResult(response);
    }
    setLoading(false);
  };

  const clearPreview = () => {
    setPreview(null);
    setResult(null);
    setCameraError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onTabChange = (value: string) => {
    setActiveTab(value);
    clearPreview();
    if(value !== 'camera') {
        stopCamera();
    }
  }

  const renderResult = () => {
    if (loading) return <ResultSkeleton />;
    if (!result) return null;

    const infoItems = [
      { icon: Sprout, label: "Scientific Name", value: result.scientificName },
      { icon: Trees, label: "Species", value: result.species },
      { icon: Globe, label: "Habitat", value: result.habitat },
      { icon: Clock, label: "Lifespan", value: result.lifespan },
    ];
  
    return (
      <Card className="mt-6 w-full animate-in fade-in duration-500 shadow-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Leaf className="w-8 h-8 text-primary" />
            <div>
              <CardTitle className="text-3xl font-headline">{result.commonName}</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {infoItems.map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <item.icon className="w-5 h-5 mt-0.5 text-primary flex-shrink-0" />
                <div>
                  <p className="font-semibold text-muted-foreground">{item.label}</p>
                  <p className="text-foreground">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2 font-headline text-foreground">Description</h3>
            <p className="text-muted-foreground leading-relaxed">{result.description}</p>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Card className="w-full shadow-xl border-border/80">
      <CardContent className="p-4 sm:p-6">
        <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted/60">
            <TabsTrigger value="upload"><Upload className="mr-2" /> Upload Image</TabsTrigger>
            <TabsTrigger value="camera"><Camera className="mr-2" /> Use Camera</TabsTrigger>
          </TabsList>
          <TabsContent value="upload" className="mt-4">
             <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg text-center h-80">
              {preview ? (
                <div className="relative w-full h-full">
                  <Image src={preview} alt="Preview" fill className="object-contain rounded-md" />
                  <Button variant="destructive" size="icon" className="absolute top-2 right-2 rounded-full z-10" onClick={clearPreview}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">Upload a plant image</h3>
                  <p className="text-sm text-muted-foreground mb-4">Drag and drop or click to select a file</p>
                  <Button onClick={() => fileInputRef.current?.click()} variant="secondary">
                    Browse Files
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                  />
                </>
              )}
            </div>
          </TabsContent>
          <TabsContent value="camera" className="mt-4">
            <div className="flex flex-col items-center justify-center p-0 border-2 border-dashed rounded-lg text-center h-80 bg-black overflow-hidden relative">
              {preview ? (
                 <div className="relative w-full h-full bg-background">
                  <Image src={preview} alt="Captured image" fill className="object-contain rounded-md" />
                  <Button variant="destructive" size="icon" className="absolute top-2 right-2 rounded-full z-10" onClick={clearPreview}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : cameraActive ? (
                <div className="relative w-full h-full">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
                  <canvas ref={canvasRef} className="hidden"></canvas>
                   <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4">
                     <div className="w-16 flex justify-center">
                        {hasMultipleCameras && (
                            <Button onClick={handleSwitchCamera} size="icon" variant="secondary" className="rounded-full">
                                <SwitchCamera />
                            </Button>
                        )}
                    </div>
                    <Button onClick={captureImage} size="lg" className="rounded-full !p-4 h-16 w-16 bg-white hover:bg-gray-200">
                      <Camera className="w-8 h-8 text-black" />
                    </Button>
                     <div className="w-16 flex justify-center">
                        <Button onClick={stopCamera} size="icon" variant="destructive" className="rounded-full">
                            <X />
                        </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-background p-4">
                  {cameraError ? (
                    <div className="text-destructive text-center">
                      <ShieldAlert className="w-12 h-12 mx-auto mb-4" />
                      <p className="font-semibold">Camera Error</p>
                      <p className="text-sm px-4">{cameraError}</p>
                      <Button onClick={startCamera} variant="secondary" className="mt-4">Try Again</Button>
                    </div>
                  ) : (
                    <>
                      <Camera className="w-12 h-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold text-white">Ready to start?</h3>
                      <p className="text-sm text-muted-foreground mb-4">Point your camera at a plant</p>
                      <Button onClick={startCamera} variant="secondary">
                        Start Camera
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        {preview && (
          <div className="mt-6 text-center">
            <Button size="lg" onClick={handleSubmit} disabled={loading} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-6 text-base shadow-lg">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Identifying...
                </>
              ) : (
                "Identify Plant"
              )}
            </Button>
          </div>
        )}

        {renderResult()}
      </CardContent>
    </Card>
  );
}

function ResultSkeleton() {
  return (
    <Card className="mt-6 w-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-full bg-muted/80" />
          <div className="w-1/2">
            <Skeleton className="h-8 w-3/4 bg-muted/80" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="w-5 h-5 rounded bg-muted/80" />
              <div className="w-full">
                <Skeleton className="h-4 w-1/3 mb-2 bg-muted/80" />
                <Skeleton className="h-4 w-2/3 bg-muted/80" />
              </div>
            </div>
          ))}
        </div>
        <div>
          <Skeleton className="h-6 w-1/4 mb-2 bg-muted/80" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full bg-muted/80" />
            <Skeleton className="h-4 w-full bg-muted/80" />
            <Skeleton className="h-4 w-5/6 bg-muted/80" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
